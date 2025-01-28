const {
    LexModelsV2Client,
    ListBotsCommand,
    ListBotAliasesCommand,
    ListBotLocalesCommand,
    ListBotVersionsCommand,
    ListCustomVocabularyItemsCommand,
    ListIntentsCommand,
    ListSlotsCommand,
    ListSlotTypesCommand,
    ListTagsForResourceCommand,    
    DescribeBotCommand,
    DescribeBotAliasCommand,
    DescribeBotLocaleCommand,
    DescribeIntentCommand,
    DescribeSlotCommand,
    DescribeSlotTypeCommand,
    DescribeBotVersionCommand,
    ResourceNotFoundException
} = require('@aws-sdk/client-lex-models-v2');

const BOTS = 'BOTS';
const ALIASES = 'ALIASES';
const LOCALES = 'LOCALES';
const VOCABS = 'VOCABS';
const VERSIONS = 'VERSIONS';
const INTENTS = 'INTENTS';
const SLOTS = 'SLOTS';
const SLOT_TYPES = 'SLOT_TYPES';

class LexWrapper {

    #lexV2;

    constructor(region) {
        this.#lexV2 = new LexModelsV2Client({ region, maxAttempts: 25 });
    }

    async #listResources(resourceType, params, respDataKey) {

        let nextToken;
        const list = [];

        do {
            // prepare request and send it
            const req = this.#getListCommand(resourceType, { ...params, nextToken });
            const resp = await this.#lexV2.send(req);

            // check response
            const metadata = resp ? resp['$metadata'] : null;
            if(!metadata || metadata.httpStatusCode !== 200) {
                console.error(`List command failed. Status = [${metadata?.httpStatusCode}].`);
                throw new Error('No response from AWS');
            }

            // extract resource summary list
            const data = resp[respDataKey] || [];
            if(!resp?.nextToken && (!Array.isArray(data) || data.length < 1)) break;

            list.push(...data);
            nextToken = resp.nextToken;

        } while(nextToken);

        return list;
    }

    #getListCommand(resourceType, params) {
        switch(resourceType) {
            case BOTS:
                return new ListBotsCommand(params);
            case ALIASES:
                return new ListBotAliasesCommand(params);
            case LOCALES:
                return new ListBotLocalesCommand(params);
            case VERSIONS:
                return new ListBotVersionsCommand(params);
            case INTENTS:
                return new ListIntentsCommand(params);
            case SLOTS:
                return new ListSlotsCommand(params);
            case SLOT_TYPES:
                return new ListSlotTypesCommand(params);
            case VOCABS:
                return new ListCustomVocabularyItemsCommand(params);
            default:
                throw new Error(`Invalid Connect resource type [${resourceType}]`);                                                                        
        }
    }

    async listBots(botNames) {

        Array.isArray(botNames) && botNames.length > 0
            ? console.log('LexWrapper.listBots: Fetching details for', botNames)
            : console.log('LexWrapper.listBots: Fetching details for all bots');

        const map = new Map();

        let bots;
        if(Array.isArray(botNames) && botNames.length > 0) {

            bots = [];

            // fetch specifi bot (one at a time since API does not support otherwise)
            for(const botName of botNames) {
                const filters = [{ name: 'BotName', values: [ botName ], operator: 'EQ' }];
                const botList =  await this.#listResources(BOTS, { filters }, 'botSummaries');
                if(!Array.isArray(botList) || botList.length < 1) {
                    console.error(`LexWrapper.listBots: Bot [${botName}] not found! Skipped ...`);
                    continue;
                }
                bots.push(botList[0]);
            }

        } else {
            // fetch all bots from Lex
            bots = await this.#listResources(BOTS, {}, 'botSummaries');
        }

        if(!Array.isArray(bots)) {
            console.warn('LexWrapper.listBots: No bots found!');
            return map;
        }

        bots.forEach((b) => map.set(b.botName, b));
        return map;
    }

    async listBotAliases(botId) {
        return await this.#listResources(ALIASES, { botId }, 'botAliasSummaries');
    }

    async listBotLocales(botId, botVersion) {
        return await this.#listResources(LOCALES, { botId, botVersion }, 'botLocaleSummaries');
    }

    async listLocaleVocabularyItems(botId, botVersion, localeId) {
        try {
            return await this.#listResources(VOCABS, { botId, botVersion, localeId }, 'customVocabularyItems');
        } catch(ex) {
            if(ex instanceof ResourceNotFoundException) return [];
            throw ex;
        }
    }

    async listBotVersions(botId, isOrderDesc = false) {
        return await this.#listResources(
            VERSIONS,
            { 
                botId,
                sortBy: {
                    attribute: 'BotVersion',
                    order: isOrderDesc === true ? 'Descending' : 'Ascending'
                }
            },
            'botVersionSummaries'
        );
    }

    async listIntents(botId, botVersion, localeId) {
        return await this.#listResources(INTENTS, { botId, botVersion, localeId }, 'intentSummaries');
    }

    async listSlots(botId, botVersion, localeId, intentId) {
        return await this.#listResources(SLOTS, { botId, botVersion, localeId, intentId }, 'slotSummaries');
    }

    async listSlotTypes(botId, botVersion, localeId) {
        return await this.#listResources(SLOT_TYPES, { botId, botVersion, localeId }, 'slotTypeSummaries');
    }

    async listResourceTags(resourceARN) {
        const resp = await this.#lexV2.send(new ListTagsForResourceCommand({ resourceARN }));
        return resp?.tags;
    }

    async describeBot(botId) {
        return await this.#lexV2.send(new DescribeBotCommand({ botId }));
    }

    async describeBot(botId) {
        return await this.#lexV2.send(new DescribeBotCommand({ botId }));
    }

    async describeBotAlias(botId, botAliasId) {
        return await this.#lexV2.send(new DescribeBotAliasCommand({ botId, botAliasId }));
    }

    async describeBotLocale(botId, botVersion, localeId) {
        return await this.#lexV2.send(new DescribeBotLocaleCommand({ botId, botVersion, localeId }));
    }

    async describeIntent(botId, botVersion, localeId, intentId) {
        return await this.#lexV2.send(new DescribeIntentCommand({ botId, botVersion, localeId, intentId }));
    }

    async describeSlot(botId, botVersion, localeId, intentId, slotId) {
        return await this.#lexV2.send(
            new DescribeSlotCommand({ botId, botVersion, localeId, intentId, slotId })
        );
    }

    async describeSlotType(botId, botVersion, localeId, slotTypeId) {
        return await  this.#lexV2.send(
            new DescribeSlotTypeCommand({ botId, botVersion, localeId, slotTypeId })
        );
    }

    async describeBotVersion(botId, botVersion) {
        return await this.#lexV2.send(new DescribeBotVersionCommand({ botId, botVersion }));
    }

} // class

module.exports = LexWrapper;