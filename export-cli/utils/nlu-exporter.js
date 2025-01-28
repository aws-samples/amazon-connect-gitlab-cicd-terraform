const { writeFileSync } = require('fs');
const LexWrapper = require('./lex-wrapper');
const StsWrapper = require('./sts-wrapper');
const release = require('../release.json');
const { mkdir, rmdir, rm, writeFile } = require('./io-util');
const { stripResponseMetadata } = require('./lex-utils');

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
        const { names, versions } = this.#getBotFilters();

        if (names.length < 1) {
            console.log('NluExporter.exportV2Bots: No bots to export!');
            return;
        }

        const bots = await this.#lex.listBots(names[0] === '*' ? [] : names);
        bots.forEach(async (b) => {
            await this.exportV2Bot(b.botId, versions.get(b.botName) || NluExporter.#LATEST_VERSION);
        });

    }

    async exportV2Bot(botId, targetVersion) {

        if (!botId) throw new Error('Illegal arg: botId is falsy!');

        const bot = stripResponseMetadata(await this.#lex.describeBot(botId));
        if (!bot.botName) throw new Error(`Bot [${botId}] not found!`);

        const botName = bot.botName;
        const botOutputPath = `${this.#outputDir}/${botName}`;
        rmdir(botOutputPath);
        mkdir(botOutputPath);

        const content = JSON.stringify(bot, null, 2);
        writeFileSync(`${botOutputPath}/bot.json`, content);

        const tags = await this.#lex.listResourceTags(`${this.#botArnPrefix}/${bot.botId}`);
        if (tags) bot.tags = tags;

        const botVersion = await this.#getVersion(botName, botId, targetVersion);
        //console.log(`NluExporter.exportV2Bot: [${botName}] target version = [${botVersion}]`);
        writeFileSync(`${botOutputPath}/source.txt`, `${botName}-v${botVersion}`);

        await this.#exportBotVersion(bot, botVersion, botOutputPath);
        await this.#exportBotAliases(botName, botId, botOutputPath);
        await this.#exportBotLocales(bot, botVersion, botOutputPath);
        console.log(`NluExporter.exportV2Bot: Exported [${botName}] bot`);
    }

    async #exportBotVersion(bot, botVersion, outputPath) {

        let version;
        if (botVersion === NluExporter.#DRAFT_VERSION) {
            version = {
                botId: bot.botId,
                botName: bot.botname,
                botVersion: NluExporter.#DRAFT_VERSION,
                roleArn: 'NA',
                dataPrivacy: bot.dataPrivacy,
                idleSessionTTLInSeconds: bot.idleSessionTTLInSeconds,
                botStatus: 'NA'
            };
        } else {
            version = stripResponseMetadata(await this.#lex.describeBotVersion(bot.botId, botVersion));
        }

        const content = JSON.stringify(version, null, 2);
        writeFileSync(`${outputPath}/version.json`, content);
        console.log(`NluExporter.exportBotVersion: [${bot.botName}] version [${version?.botVersion}]`);
    }

    async #exportBotAliases(botName, botId, outputPath) {

        const content = [];
        const aliases = await this.#lex.listBotAliases(botId);

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

        writeFileSync(`${outputPath}/aliases.json`, JSON.stringify(content, null, 2));
        console.log(`NluExporter.exportBotAliases: Exported [${content.length}] [${botName}] aliases`);
    }

    async #exportBotLocales(bot, botVersion, outputPath) {

        const content = [];
        const { botId, botName } = bot;
        const locales = await this.#lex.listBotLocales(botId, botVersion);
        const localesPath = `${outputPath}/locales`;
        mkdir(localesPath);

        for (const l of locales) {

            if (!l) continue;
            const localeId = l.localeId;
            const locale = stripResponseMetadata(await this.#lex.describeBotLocale(botId, botVersion, localeId));
            if (!locale) {
                console.warn(`NluExporter.exportBotLocales: [${botName}/${localeId}] locale not found! Skipped.`);
                continue;
            }

            content.push(locale);
            const localePath = `${localesPath}/${localeId}`;
            mkdir(localePath);
            await this.#exportCustomVocabularies(bot, botVersion, localeId, localePath);
            await this.#exportSlotTypes(bot, botVersion, localeId, localePath);
            await this.#exportIntents(bot, botVersion, localeId, localePath);
            console.log(`NluExporter.exportBotLocales: Exported [${botName}/${localeId}] locale`);
        }

        //console.log(`NluExporter.exportBotLocales: [${botName}] locales =`, JSON.stringify(content, null, 2));
        mkdir(localesPath);
        writeFileSync(`${localesPath}/locales.json`, JSON.stringify(content, null, 2));
    }

    async #exportCustomVocabularies(bot, botVersion, localeId, outputPath) {

        if (!NluExporter.CUST_VOCAB_LOCALES.includes(localeId)) return;

        const items = [];
        const { botId, botName } = bot;
        const vocab = await this.#lex.listLocaleVocabularyItems(botId, botVersion, localeId);
        console.log(`NluExporter.exportCustomVocabularies: [${botName}/${localeId}] vocab =`, JSON.stringify(vocab, null, 2));

        let content = 'phrase\tweight\tdisplayAs';
        for (const v of vocab) {
            if (!v) continue;
            items.push({ phrase: v.phrase, displayAs: v.displayAs, weight: v.weight });
            content += v.displayAs ? `\n${v.phrase}\t${v.weight}\t${v.displayAs}` : `\n${v.phrase}\t${v.weight}`;
        }

        // write tsv file
        const tsvFile = writeFile(outputPath, 'CustomVocabulary.tsv', content);
        console.log(`NluExporter.exportCustomVocabularies: tsvFile [${tsvFile}]`);
    }

    async #exportSlotTypes(bot, botVersion, localeId, outputPath) {

        const { botId, botName } = bot;
        const slotTypes = await this.#lex.listSlotTypes(botId, botVersion, localeId);
        //console.log(`NluExporter.exportSlotTypes: [${botName}/${localeId}] intents =`, JSON.stringify(slotTypes, null, 2));

        const slotTypesPath = `${outputPath}/slottypes`;
        mkdir(slotTypesPath);

        for (const st of slotTypes) {

            if (!st) continue;
            const { slotTypeId, slotTypeName } = st;
            const slotType = stripResponseMetadata(await this.#lex.describeSlotType(botId, botVersion, localeId, slotTypeId));
            if (!slotType) {
                console.warn(`NluExporter.exportSlotTypes: [${botName}/${localeId}/${slotTypeName}] slot type not found! Skipped.`);
                continue;
            }

            writeFileSync(`${slotTypesPath}/${slotTypeName}.json`, JSON.stringify(slotType, null, 2));
            console.log(`NluExporter.exportSlotTypes: Exported [${botName}/${slotTypeName}] slot type`);
        }

    }

    async #exportIntents(bot, botVersion, localeId, outputPath) {

        const { botId, botName } = bot;
        const intents = await this.#lex.listIntents(botId, botVersion, localeId);
        const intentsPath = `${outputPath}/intents`;
        mkdir(intentsPath);
        const slotTypesPath = `${outputPath}/slottypes`;
        mkdir(slotTypesPath);

        for (const i of intents) {

            if (!i) continue;
            const { intentId, intentName } = i;
            const intent = stripResponseMetadata(await this.#lex.describeIntent(botId, botVersion, localeId, intentId));
            if (!intent) {
                console.warn(`NluExporter.exportIntents: [${botName}/${localeId}/${intentName}] intent not found! Skipped.`);
                continue;
            }

            writeFileSync(`${intentsPath}/${intentName}.json`, JSON.stringify(intent, null, 2));
            await this.#exportSlots(bot, botVersion, localeId, intent, outputPath);
            console.log(`NluExporter.exportIntents: Exported [${botName}/${intentName}] intent`);
        }

    }

    async #exportSlots(bot, botVersion, localeId, intent, outputPath) {

        const { botId, botName } = bot;
        const { intentId, intentName } = intent;
        const slotsPath = `${outputPath}/slots`;
        mkdir(slotsPath);
        const slots = await this.#lex.listSlots(botId, botVersion, localeId, intentId);

        for (const s of slots) {

            if (!s) continue;
            const { slotId, slotName } = s;
            const slot = stripResponseMetadata(await this.#lex.describeSlot(botId, botVersion, localeId, intentId, slotId));
            if (!slot) {
                console.warn(`NluExporter.exportSlots: [${botName}/${localeId}/${intentId}/${slotId}] slot not found! Skipped.`);
                continue;
            }

            writeFileSync(`${slotsPath}/${intentName}_${slotName}.json`, JSON.stringify(slot, null, 2));
            console.log(`NluExporter.exportSlots: Exported [${botName}/${intentName}/${slotName}] slot`);
        }
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
            versions: new Map()
        };

        const bots = release['bots'] || [];
        if (!Array.isArray(bots) || bots.length < 1) {
            console.warn('NluExporter.getBotFilters: Release bot list is empty.');
            return data;
        }

        for (const b of bots) {

            if (!b || typeof b !== 'string') continue;

            const tokens = b.split(':');
            if (tokens.length < 1 || !tokens[0]) continue;

            // handle wildcard
            if (tokens.length === 1 && tokens[0].trim() === '*') {
                data.names = ['*'];
                data.versions.clear();
                return data;
            }

            const name = tokens[0];
            const version = tokens.length > 1
                ? tokens[1] || NluExporter.#LATEST_VERSION
                : NluExporter.#LATEST_VERSION;

            data.names.push(name);
            data.versions.set(name, version);
        }

        return data;
    }

}

module.exports = NluExporter;