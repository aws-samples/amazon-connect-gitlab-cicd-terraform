import {
    ListBotsCommand,
    ListBotAliasesCommand,
    BotSummary,
    BotAliasSummary,
    LexModelsV2Client,
} from "@aws-sdk/client-lex-models-v2";
import { Logger } from "@aws-lambda-powertools/logger";
import { getLexClient } from "./aws";
import { Utils } from "./misc";

const region = process.env.AWS_REGION;
const env = process.env.ENVIRONMENT;
const account = process.env.ACCOUNT;
const logger = new Logger({ serviceName: "provisioner.lex" });

/**
 * Class for managing Lex bots.
 */
export class LexBotManager {
    private client: LexModelsV2Client;

    constructor() {
        this.client = getLexClient(region);
    }

    /**
     * Lists all Lex bots.
     * @returns {BotSummary[]} An array of bot summaries.
     */
    public async listBots(): Promise<BotSummary[]> {
        try {
            let nextToken: string | undefined;
            const bots: BotSummary[] = [];
            do {
                const lexList = new ListBotsCommand({ nextToken: nextToken });
                const lexResp = await this.client.send(lexList);
                const data = lexResp?.botSummaries || [];
                if (data.length < 1) break;
                nextToken = lexResp?.nextToken;
                bots.push(...data);
            } while (nextToken);
            logger.info(`LexBotManager.listBots: Found ${bots.length}`);
            logger.debug(`LexBotManager.listBots: `, {
                bots: bots.map((o) => o.botName),
            });
            return bots;
        } catch (error) {
            logger.error(
                "LexBotManager.listBots: Error listing bots",
                error as Error,
            );
            throw error;
        }
    }

    private async listAliases(botId: string) {
        let nextToken: string | undefined;
        const aliases: BotAliasSummary[] = [];
        const map = new Map<string, BotAliasSummary>();

        do {
            const resp = await this.client.send(
                new ListBotAliasesCommand({
                    botId,
                    nextToken,
                }),
            );

            const data = resp?.botAliasSummaries || [];
            if (data.length < 1) break;
            nextToken = resp?.nextToken;
            aliases.push(...data);
        } while (nextToken);

        for (const a of aliases) {
            if (!a?.botAliasName) continue;
            map.set(a.botAliasName, a);
        }

        return map;
    } // method

    public mapBotAliases = async (
        BOTS: BotSummary[],
    ): Promise<Map<string, string>> => {
        const botMap = new Map<string, BotSummary>();
        for (const b of BOTS) {
            if (!b?.botName) continue;
            botMap.set(b.botName, b);
        }
        const aliasMap = new Map<string, string>();

        // iterate through bot list
        for (const [key, value] of botMap) {
            const botId = value?.botId;
            if (!botId || !key) continue;

            const botName = key;
            const aliases = await this.listAliases(botId);

            // for each bot, iterate through aliases
            aliases.forEach((value, key) => {
                const aliasName = key;
                const aliasId = value?.botAliasId;
                if (!aliasName || !aliasId) return;
                aliasMap.set(
                    `${botId}/${aliasId}`,
                    `arn:aws:lex:${region}:${account}:bot-alias/${botId}/${aliasId}`,
                );
                aliasMap.set(
                    `${botName}/${aliasName}`,
                    `arn:aws:lex:${region}:${account}:bot-alias/${botId}/${aliasId}`,
                );
                if (
                    aliasName.toLowerCase() === env ||
                    aliasName.toLowerCase() === "current"
                ) {
                    aliasMap.set(
                        `${botName}`,
                        `arn:aws:lex:${region}:${account}:bot-alias/${botId}/${aliasId}`,
                    );
                }
            });
        }

        return aliasMap;
    };

    //   /**
    //    * Lists Lex bots by prefix.
    //    * @param {string} NAMING_PREFIX - The naming prefix.
    //    * @param {string} CAPABILITY_ID - The capability ID.
    //    * @param {string} IVR_ID - The IVR ID.
    //    * @returns {Map<string, string>} A map of bot names and their ARNs.
    //    */
    //   public async listLexBotsByPrefix(
    //     NAMING_PREFIX: string,
    //     CAPABILITY_ID: string,
    //     IVR_ID: string,
    //     BOTS: BotSummary[],
    //   ): Promise<Map<string, string>> {
    //     const LexMap = new Map();
    //     const filteredBotList = await this.filterLexbotsByPrefix(
    //       BOTS,
    //       NAMING_PREFIX,
    //       CAPABILITY_ID,
    //     );
    //     const arnMap = await this.getLexbotArns(filteredBotList, IVR_ID);
    //     for (const entry of arnMap.entries()) {
    //       LexMap.set(entry[0], entry[1]);
    //     }
    //     logger.info("LexBotManager.listLexBotsByPrefix: ", {
    //       lex_arns: Object.fromEntries(LexMap),
    //     });
    //     return LexMap;
    //   }

    //   public async listLexBotsByIncludes(
    //     LEXBOT_INCLUDES: string[],
    //     BOTS: BotSummary[],
    //     IVR_ID: string,
    //   ): Promise<Map<string, string>> {
    //     const LexMap = new Map();
    //     const filteredBotList = await this.filterLexbotsByIncludes(
    //       BOTS,
    //       LEXBOT_INCLUDES,
    //     );
    //     const arnMap = await this.getLexbotArns(filteredBotList, IVR_ID);
    //     for (const entry of arnMap.entries()) {
    //       LexMap.set(entry[0], entry[1]);
    //     }
    //     logger.info("LexBotManager.listLexBotsByIncludes: ", {
    //       lex_arns: Object.fromEntries(LexMap),
    //     });
    //     return LexMap;
    //   }

    //   public async getAllArns(
    //     BOTS: BotSummary[],
    //     IVR_ID: string,
    //   ): Promise<Map<string, string>> {
    //     const LexMap = new Map();
    //     const arnMap = await this.getLexbotArns(BOTS, IVR_ID);
    //     for (const entry of arnMap.entries()) {
    //       LexMap.set(entry[0], entry[1]);
    //     }
    //     logger.info("LexBotManager.listLexBotsByIncludes: ", {
    //       lex_arns: Object.fromEntries(LexMap),
    //     });
    //     return LexMap;
    //   }

    //   /**
    //    * Filters Lex bots by prefix.
    //    * @param {BotSummary[]} BOTS - An array of bot summaries.
    //    * @param {string} NAMING_PREFIX - The naming prefix.
    //    * @param {string} CAPABILITY_ID - The capability ID.
    //    * @returns {BotSummary[]} An array of filtered bot summaries.
    //    */
    //   private async filterLexbotsByPrefix(
    //     BOTS: BotSummary[],
    //     NAMING_PREFIX: string,
    //     CAPABILITY_ID: string,
    //   ): Promise<BotSummary[]> {
    //     const lexbotsFiltered = BOTS.filter(
    //       (o) =>
    //         o.botName.startsWith(`${CAPABILITY_ID}`) ||
    //         o.botName.startsWith(`${NAMING_PREFIX}`),
    //     );
    //     logger.info(
    //       `LexBotManager.filterLexBotsByPrefix: prefixes ${CAPABILITY_ID} or ${NAMING_PREFIX} :`,
    //       { log_detail: lexbotsFiltered },
    //     );

    //     return lexbotsFiltered;
    //   }

    //   /**
    //    * Filters Lex bots by includes.
    //    * @param {BotSummary[]} BOTS - An array of bot summaries.
    //    * @param {string[]} INCLUDES - An array of strings to include.
    //    * @returns {BotSummary[]} An array of filtered bot summaries.
    //    */
    //   private async filterLexbotsByIncludes(
    //     BOTS: BotSummary[],
    //     INCLUDES: string[],
    //   ): Promise<BotSummary[]> {
    //     return BOTS.filter((bot) => INCLUDES.includes(bot.botName));
    //   }

    //   /**
    //    * Gets the ARNs of Lex bots.
    //    * @param {BotSummary[]} BOTS - An array of bot summaries.
    //    * @returns {Map<string, string>} A map of bot names and their ARNs.
    //    */
    //   private async getLexbotArns(
    //     BOTS: BotSummary[],
    //     IVR_ID: string,
    //   ): Promise<Map<string, string>> {
    //     const localObjMap = new Map();
    //     try {
    //       for (const bot of BOTS) {
    //         const command = new ListBotAliasesCommand({
    //           botId: bot.botId,
    //         });
    //         const resp = await this.client.send(command);
    //         const data = resp.botAliasSummaries;
    //         logger.info(
    //           `LexBotManager.getLexbotArns.listLexBotAliases: name:${bot.botName} id:${bot.botId} env:${env}`,
    //           { log_detail: data },
    //         );
    //         const filterListByEnv = data.filter(
    //           (o) => o.botAliasName.toLowerCase() === `${env}`,
    //         );
    //         const aliasID = filterListByEnv.map((i) => i.botAliasId);

    //         if (aliasID[0] !== undefined) {
    //           const lbArn = `arn:aws:lex:${region}:${account}:bot-alias/${bot.botId}/${aliasID[0]}`;
    //           localObjMap.set(bot.botName, lbArn);
    //           if (bot.botName.endsWith(`${IVR_ID}-${env}`)) {
    //             const trimmed = await Utils.trimEndString(
    //               bot.botName,
    //               `-${IVR_ID}-${env}`,
    //             );
    //             localObjMap.set(trimmed, lbArn);
    //           }
    //         } else {
    //           logger.error(
    //             `LexBotManager.getLexbotArns:${bot.botName} has no alias matching environment name.`,
    //           );
    //         }
    //       }
    //       return localObjMap;
    //     } catch (error) {
    //       logger.error("Error adding lexbots to file", error as Error);
    //       throw error;
    //     }
    //   }
}
