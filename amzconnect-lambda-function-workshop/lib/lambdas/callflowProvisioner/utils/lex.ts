import {
    LexModelsV2Client,
    ListBotsCommand,
    ListBotAliasesCommand,
    BotSummary
} from "@aws-sdk/client-lex-models-v2";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { ConfiguredRetryStrategy } from "@smithy/util-retry";
const region = process.env.AWS_REGION;
const env = process.env.FUNCTION_ENV;
const app = process.env.FUNCTION_APP;
const account = process.env.FUNCTION_ACCOUNT;
const logLevel = process.env.LOG_LEVEL || "INFO";
const tracer = new Tracer({ serviceName: "provisioner.lex" });
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner.lex" });

// Initialize Clients
const lexclient = tracer.captureAWSv3Client(
    new LexModelsV2Client({
        region: region,
        retryStrategy: new ConfiguredRetryStrategy(
           4, // max attempts
           (attempt: number) => 100 + attempt * 1000 // backoff function.
         ),
       }),
);

export async function listLexBots(INSTANCE_ID: string, NAMING_PREFIX: string, CAPABILITY_ID: string) {
    const localObjMap = new Map();

    //* Get list of Lex alias arns
    try {
        let nextToken: string | undefined;
        const bots: BotSummary[] = []
        do {
            const lexList = new ListBotsCommand({ nextToken: nextToken });
            const lexResp = await lexclient.send(lexList);
            const data = lexResp?.botSummaries || []
            if(data.length < 1) break;
            nextToken = lexResp?.nextToken;
            bots.push(...data);
        } while(nextToken);
        logger.info(`Lex.listBots: Found ${bots.length}`);

        //* Get list of bots and filter them by name

        const lexRespFilter = bots.filter(
            (o) =>
            o.botName.startsWith(`${CAPABILITY_ID}`) ||
            o.botName.startsWith(`${NAMING_PREFIX}`),
        );
        logger.info(`lex.listLexBots:bots matching prefixes ${CAPABILITY_ID} or ${NAMING_PREFIX} :`, {log_detail: lexRespFilter});


        //* Loop through filtered list and get aliases assigned to them
        for (const bot of lexRespFilter) {
            const lbac = new ListBotAliasesCommand({
                botId: bot.botId,
            });
            const lbacResp = await lexclient.send(lbac);
            const _lbac = lbacResp.botAliasSummaries;
            logger.info(
                "lex.listLexBots:aliases matching env:",
                {log_detail: _lbac}
            );
            const lbacRespList = _lbac.filter(
                (o) => o.botAliasName === `${env}`,
            );
            const lbacRespListMap = lbacRespList.map((i) => {
                return i.botAliasId;
            });
            if (lbacRespListMap[0] != undefined ) {
                // Construct Arn to add to Object map.
                const lbArn = `arn:aws:lex:${region}:${account}:bot-alias/${bot.botId}/${lbacRespListMap[0]}`;
                // await createSsmParam(bot.botName, lbArn);
                localObjMap.set(bot.botName, lbArn);
            } else {
                logger.error(`lex.listLexBots:${bot.botName} matches prefix name, but has no alias matching environment name.`)
            }
        }
    } catch (error) {
        logger.error("Error adding lexbots to file", error as Error);
        throw error;
    }
    return localObjMap
}