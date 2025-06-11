const { writeFileSync } = require('fs');
const LexWrapper = require('./lex-wrapper');
const StsWrapper = require('./sts-wrapper');
const release = require('../release.json');
const { mkdir, rmdir, rm, writeFile } = require('./io-util');
const { stripResponseMetadata } = require('./lex-utils');
const https = require('https');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const placeholders = require('../placeholders.json');

class NluExporter {

    static #DRAFT_VERSION = 'DRAFT';
    static #LATEST_VERSION = 'LATEST';
    static CUST_VOCAB_LOCALES = ['en_US', 'en_GB'];

    #lex;
    #sts;
    #outputDir;
    #botArnPrefix;
    #aliasArnPrefix;
    #region;

    constructor(region, outputDir) {

        this.#region = region;
        console.log(`NluExporter: region = [${this.#region}]`);

        this.#outputDir = `${outputDir}/bots`;
        console.log(`NluExporter: outputDir = [${this.#outputDir}]`);

        this.#lex = new LexWrapper(region);
        this.#sts = new StsWrapper(region);
    }

    async exportResources() {
        const accountId = await this.#sts.getAccountId();
        this.#botArnPrefix = `arn:aws:lex:${this.#region}:${accountId}:bot`;
        this.#aliasArnPrefix = `arn:aws:lex:${this.#region}:${accountId}:bot-alias`;
        await this.exportV2Bots();
    }

    async exportV2Bots() {
        mkdir(this.#outputDir);
        const { names, versions, prefixFilters, excludePrefixFilters } = this.#getBotFilters();

        // Always fetch all bots if we have prefix filters or exclusion filters
        const fetchAllBots = prefixFilters.length > 0 || excludePrefixFilters.length > 0 || names.length < 1;
        
        // Fetch bots from AWS
        const bots = await this.#lex.listBots(fetchAllBots ? [] : names);
        
        if (bots.size < 1) {
            console.log('NluExporter.exportV2Bots: No bots found!');
            return;
        }

        // Filter bots based on our criteria
        let botsToExport = new Map();
        
        if (prefixFilters.length > 0 || excludePrefixFilters.length > 0 || names.length > 0) {
            console.log(`NluExporter.exportV2Bots: Filtering ${bots.size} bots using ${prefixFilters.length} prefix filters, ${excludePrefixFilters.length} exclusion filters, and ${names.length} specific names`);
            
            bots.forEach((bot, botName) => {
                // First check if the bot should be excluded
                if (excludePrefixFilters.some(prefix => botName.startsWith(prefix))) {
                    return; // Skip this bot
                }
                
                // Then check if the bot matches inclusion criteria
                if (prefixFilters.some(prefix => botName.startsWith(prefix)) || names.includes(botName)) {
                    botsToExport.set(botName, bot);
                }
            });
            
            console.log(`NluExporter.exportV2Bots: Found ${botsToExport.size} bots after filtering`);
        } else {
            // No filtering needed
            botsToExport = bots;
        }

        // Export each bot
        if (botsToExport.size > 0) {
            botsToExport.forEach(async (b) => {
                await this.exportV2Bot(b.botId, versions.get(b.botName) || NluExporter.#LATEST_VERSION);
            });
        } else {
            console.log('NluExporter.exportV2Bots: No bots to export after filtering!');
        }
    }

    async exportV2Bot(botId, targetVersion) {
        if (!botId) throw new Error('Illegal arg: botId is falsy!');

        // Get basic bot information
        const bot = stripResponseMetadata(await this.#lex.describeBot(botId));
        if (!bot.botName) throw new Error(`Bot [${botId}] not found!`);

        const botName = bot.botName;
        const botOutputPath = `${this.#outputDir}/${botName}`;
        rmdir(botOutputPath);
        mkdir(botOutputPath);

        // Get the appropriate version
        const botVersion = await this.#getVersion(botName, botId, targetVersion);
        console.log(`NluExporter.exportV2Bot: [${botName}] target version = [${botVersion}]`);

        // Skip DRAFT version - we only want to export numeric versions
        if (botVersion === NluExporter.#DRAFT_VERSION) {
            console.log(`NluExporter.exportV2Bot: Skipping DRAFT version for [${botName}]`);
            return;
        }

        // Use the AWS export API to get the complete bot definition
        console.log(`Initiating export for bot ${botId} version ${botVersion}...`);
        const createExportResponse = await this.#lex.createBotExport(botId, botVersion);
        const exportId = createExportResponse.exportId;
        console.log(`Export initiated with ID: ${exportId}`);
        
        // Poll until export is complete
        console.log("Waiting for export to complete...");
        let exportStatus, exportUrl;
        do {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
            
            const describeResponse = await this.#lex.describeBotExport(exportId);
            exportStatus = describeResponse.exportStatus;
            console.log(`Export status: ${exportStatus}`);
            
            if (exportStatus === "Completed") {
                exportUrl = describeResponse.downloadUrl;
            } else if (exportStatus === "Failed") {
                throw new Error(`Export failed: ${describeResponse.failureReasons}`);
            }
        } while (exportStatus === "InProgress");
        
        if (!exportUrl) {
            throw new Error("Export completed but no download URL was provided");
        }
        
        // Download and extract the export
        const zipPath = path.join(botOutputPath, `bot-${botVersion}.zip`);
        await this.#downloadFile(exportUrl, zipPath);
        await this.#extractZipFile(zipPath, botOutputPath);
        
        // We're done - the extracted files from the zip are in the output directory
        console.log(`NluExporter.exportV2Bot: Exported [${botName}] bot version ${botVersion}`);
        await this.#exportBotAliases(botName, botId, botOutputPath);
        console.log(`NluExporter.exportV2Bot: Exported [${botName}] bot`);
    }

    async #downloadFile(url, outputPath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(outputPath);
            
            https.get(url, (response) => {
                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    console.log(`File downloaded to ${outputPath}`);
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(outputPath, () => {}); // Delete the file on error
                reject(err);
            });
        });
    }

    async #extractZipFile(zipPath, extractPath) {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        console.log(`Extracted zip file to ${extractPath}`);
        
        // Delete the zip file after extraction
        fs.unlinkSync(zipPath);
        console.log(`Deleted temporary zip file: ${zipPath}`);
    }

    #findBotJson(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const result = this.#findBotJson(filePath);
                if (result) return result;
            } else if (file === 'Bot.json') {
                return filePath;
            }
        }
        return null;
    }

    async #getVersion(botName, botId, targetVersion = NluExporter.#LATEST_VERSION) {

        let versions = await this.#lex.listBotVersions(botId);
        versions = versions.map((v) => v.botVersion);
        if (versions.length <= 0) throw new Error(`Bot [${botName}/${botId}] versions not found!`);

        if (versions.length === 1 && targetVersion === NluExporter.#LATEST_VERSION) {
            return versions[0];
        }

        if (versions.includes(targetVersion) && targetVersion !== NluExporter.#LATEST_VERSION) {
            return targetVersion;
        }

        if (targetVersion === NluExporter.#LATEST_VERSION) {
            versions = versions.filter((v) => v !== NluExporter.#DRAFT_VERSION);
            versions.sort((a, b) => b - a);
            return versions[0];
        }

        throw new Error(`Bot [${botName}/${botId}] version [${targetVersion}] not found!`)
    }

    #getBotFilters() {
        const data = {
            names: [],
            versions: new Map(),
            prefixFilters: [],
            excludePrefixFilters: []  // New array for exclusion patterns
        };

        const bots = release['bots'] || [];
        if (!Array.isArray(bots) || bots.length < 1) {
            console.warn('NluExporter.getBotFilters: Release bot list is empty.');
            return data;
        }

        // Check if we have a wildcard entry that matches all bots
        if (bots.includes('*')) {
            console.log('NluExporter.getBotFilters: Wildcard "*" detected, fetching all bots');
            data.names = []; // Empty array will fetch all bots
            return data;
        }

        // Process each bot entry
        for (const b of bots) {
            if (!b || typeof b !== 'string') continue;

            const tokens = b.split(':');
            if (tokens.length < 1 || !tokens[0]) continue;

            let name = tokens[0];
            const version = tokens.length > 1
                ? tokens[1] || NluExporter.#LATEST_VERSION
                : NluExporter.#LATEST_VERSION;

            // Check if this is an exclusion pattern
            const isExclude = name.startsWith('!');
            if (isExclude) {
                name = name.slice(1); // Remove the ! at the beginning
            }

            // If this is a prefix wildcard (e.g., "QnA*" or "!QnA*")
            if (name.endsWith('*') && name !== '*') {
                const prefix = name.slice(0, -1); // Remove the * at the end
                
                if (isExclude) {
                    console.log(`NluExporter.getBotFilters: Exclusion prefix detected: "!${prefix}*"`);
                    data.excludePrefixFilters.push(prefix);
                } else {
                    console.log(`NluExporter.getBotFilters: Prefix wildcard detected: "${prefix}*"`);
                    data.prefixFilters.push(prefix);
                }
            } else if (isExclude) {
                // This is an exact bot name to exclude
                console.log(`NluExporter.getBotFilters: Exclusion name detected: "!${name}"`);
                data.excludePrefixFilters.push(name); // Add the exact name to exclude
            } else {
                // This is an exact bot name to include
                data.names.push(name);
                data.versions.set(name, version);
            }
        }

        return data;
    }

    async #exportBotAliases(botName, botId, outputPath) {

        const content = [];
        const aliases = await this.#lex.listBotAliases(botId);
        const accountId = await this.#sts.getAccountId();

        for (const a of aliases) {

            const alias = stripResponseMetadata(await this.#lex.describeBotAlias(botId, a.botAliasId));
            if (!alias) {
                console.warn(`NluExporter.exportBotAliases: [${botName}/${a.botAliasId}] alias not found! Skipped.`);
                return;
            }

            const tags = await this.#lex.listResourceTags(`${this.#aliasArnPrefix}/${botId}/${a.botAliasId}`);
            if (tags) alias.tags = tags;

            console.log(`NluExporter.exportBotAliases: Exporting [${botName}/${a.botAliasName}] alias ...`);
            content.push(alias);
        }

        let aliasContent = JSON.stringify(content, null, 2);
        aliasContent = aliasContent.replaceAll(accountId, placeholders.ACCOUNT);
        aliasContent = aliasContent.replaceAll(this.#region, placeholders.REGION);

        writeFileSync(`${outputPath}/aliases.json`, aliasContent); //JSON.stringify(aliasContent, null, 2)
        console.log(`NluExporter.exportBotAliases: Exported [${aliasContent.length}] [${botName}] aliases`);
    }
}

module.exports = NluExporter;
