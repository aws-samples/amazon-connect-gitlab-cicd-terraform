
'use strict';
const fs = require('fs');
const ConnectWrapper = require('./connect-wrapper');
const LexWrapper = require('./lex-wrapper');
const StsWrapper = require('./sts-wrapper');
const QiCWrapper = require('./qic-wrapper');
const { mkdir } = require('./io-util');
const { join } = require('path');
const cdk = require('../cdk.json');
const release = require('../release.json');
const placeholders = require('../placeholders.json');

class CxExporter {

    #instance;
    #region
    #connect;
    #lex;
    #sts;
    #outputDir;
    #qic

    constructor(instance, region, outputDir) {
        this.#instance = instance;
        this.#region = region;
        this.#outputDir = outputDir;
        this.#connect = new ConnectWrapper(region, instance);
        this.#lex = new LexWrapper(region);
        this.#sts = new StsWrapper(region);
        this.#qic = new QiCWrapper(region);
        console.log(`CxExporter: outputDir = [${this.#outputDir}]`);
    }

    async exportConnect() {
        const hoopList = await this.#connect.listHoop();
        const qList = await this.#connect.listQueues();
        const moduleList = await this.#connect.listContactFlowModules();
        const flowList = await this.#connect.listContactFlows();
        const rpList = await this.#connect.listRoutingProfiles();
        const qcList = await this.#connect.listQuickConnects();
        const promptList = await this.#connect.listPrompts();
        const phoneList = await this.#connect.listPhoneNumbers();
        const assistantMap = await this.#qic.listAssistants();
        const botAliases = await this.#mapBotAliases();
        const accountId = await this.#sts.getAccountId();
        await this.exportHoop(hoopList);
        await this.exportQueues(qList, hoopList, phoneList, flowList);
        await this.exportModules(accountId, moduleList, qList, hoopList, promptList, flowList, botAliases, assistantMap);
        await this.exportFlows(accountId, flowList, moduleList, qList, hoopList, promptList, botAliases, assistantMap);
        await this.exportRoutingProfiles(rpList, qList);
        await this.exportQuickConnects(qcList, flowList, qList);
        await this.exportSecurityProfiles();
        await this.exportAgentStatuses();
    };

    async exportHoop(hoopList) {

        const filetered = this.#applyFilters(hoopList, release.hoop);
        if (filetered.length < 1) return;

        const dir = join(this.#outputDir, 'hoop');
        mkdir(dir);

        filetered.forEach(async (h) => {
            const data = await this.#connect.describeHoop(h.Id);
            const fileName = join(dir, `${data.Name}.json`);
            let content = JSON.stringify({
                Name: data.Name,
                Description: data.Description,
                TimeZone: data.TimeZone,
                Config: data.Config
            }, null, 2);
            fs.writeFileSync(fileName, content); // write to local disk
            console.log(`CxExporter.exportHoop: Exported [${data.Name}]`);
        });

    };

    async exportQueues(qList, hoopList, phoneList, flowList) {

        const filtered = this.#applyFilters(qList, release.queues);
        if (filtered.length < 1) return;

        phoneList = phoneList.map(p => {
            return { Id: p.Id, Name: p.PhoneNumber };
        });

        // Map IDs to friendly names
        const hoopMap = ConnectWrapper.toMap(hoopList, true);
        const flowMap = ConnectWrapper.toMap(flowList, true);
        const phoneMap = ConnectWrapper.toMap(phoneList, true);
        const dir = join(this.#outputDir, 'queues');
        mkdir(dir);

        filtered.forEach(async (q) => {

            //setTimeout(() => {}, 100);
            const data = await this.#connect.describeQueue(q.Id);
            if (!hoopMap.has(data.HoursOfOperationId)) throw new Error(`Queue [${data.HoursOfOperationId}] not found!`);

            const fileName = join(dir, `${data.Name}.json`);
            const queue = {
                Name: data.Name,
                Description: data.Description,
                Status: data.Status,
                HoursOfOperationId: hoopMap.get(data.HoursOfOperationId),
                Status: data.Status,
                MaxContacts: data.MaxContacts,
                QueueId: data.QueueId,
                Tags: data.Tags || {}
            };

            const outboundCallerConfig = this.#mapOutboundConfigIds(data.OutboundCallerConfig, phoneMap, flowMap);

            if (Object.keys(outboundCallerConfig).length > 0) {
                queue.OutboundCallerConfig = outboundCallerConfig;
            }

            const quickConencts = await this.#connect.listQueueQuickConnects(q.Id);
            queue.QuickConnects = quickConencts.map(qc => qc.Name);

            fs.writeFileSync(fileName, JSON.stringify(queue, null, 2)); // write to local disk
            console.log(`CxExporter.exportQueues: Exported [${data.Name}]`);

        });

    };

    async exportModules(accountId, moduleList, qList, hoopList, promptList, flowList, botAliases, assistantMap) {

        const filtered = this.#applyFilters(moduleList, release.modules);
        if (filtered.length < 1) return;

        const hMap = ConnectWrapper.toMap(hoopList, true);
        const pMap = ConnectWrapper.toMap(promptList, true);
        const qMap = ConnectWrapper.toMap(qList, true); // map by qid
        const fMap = ConnectWrapper.toMap(flowList, true);
        const dir = join(this.#outputDir, 'flows');
        mkdir(dir);

        for (const m of filtered) {

            const data = await this.#connect.describeContactFlowModule(m.Id);
            const fileName = join(dir, `${data.Name}.json`);
            const module = { Name: data.Name, Content: data.Content };

            if (data.Tags) {
                module.Tags = data.Tags;
            }

            if (data.Description) {
                module.Description = data.Description;
            }

            let content = JSON.stringify(module, null, 2);
            content = content.replaceAll(accountId, placeholders.ACCOUNT);
            content = content.replaceAll(this.#region, placeholders.REGION);
            content = content.replaceAll(this.#instance, placeholders.INSTANCE);
            content = this.#replaceLambdaStage(content);
            content = this.#replaceIds(content, hMap, 'operating-hours');
            content = this.#replaceIds(content, pMap, 'prompt');
            content = this.#replaceIds(content, qMap, 'queue'); // replace Queue IDs with Queue names
            content = this.#replaceIds(content, fMap, 'contact-flow');
            content = this.#replaceBotReferences(content, botAliases);
            content = this.#replaceAssistantIds(content, assistantMap);
            fs.writeFileSync(fileName, content);  // write to local disk
            console.log(`CxExporter.exportModules: Exported [${data.Name}]`);

        } // for(const f ...)

    };

    async exportFlows(accountId, flowList, moduleList, qList, hoopList, promptList, botAliases, assistantMap) {

        const filtered = this.#applyFilters(flowList, release.flows);
        if (filtered.length < 1) return;

        const hMap = ConnectWrapper.toMap(hoopList, true);
        const pMap = ConnectWrapper.toMap(promptList, true);
        const qMap = ConnectWrapper.toMap(qList, true); // map by qid
        const mMap = ConnectWrapper.toMap(moduleList, true);
        const fMap = ConnectWrapper.toMap(flowList, true);
        const dir = join(this.#outputDir, 'flows');
        mkdir(dir);

        for (const f of filtered) {

            const data = await this.#connect.describeContactFlow(f.Id);
            const fileName = join(dir, `${data.Name}.json`);
            const flow = { Name: data.Name, Type: data.Type, Content: data.Content };

            if (data.Tags) {
                flow.Tags = data.Tags;
            }

            if (data.Description) {
                flow.Description = data.Description;
            }

            let content = JSON.stringify(flow, null, 2);
            content = content.replaceAll(accountId, placeholders.ACCOUNT);
            content = content.replaceAll(this.#region, placeholders.REGION);
            content = content.replaceAll(this.#instance, placeholders.INSTANCE);
            content = this.#replaceLambdaStage(content);
            content = this.#replaceModuleIds(content, mMap);
            content = this.#replaceIds(content, hMap, 'operating-hours');
            content = this.#replaceIds(content, pMap, 'prompt');
            content = this.#replaceIds(content, qMap, 'queue');
            content = this.#replaceIds(content, fMap, 'contact-flow');
            content = this.#replaceBotReferences(content, botAliases);
            content = this.#replaceAssistantIds(content, assistantMap);
            fs.writeFileSync(fileName, content);  // write to local disk
            console.log(`CxExporter.exportFlows: Exported [${data.Name}]`);

        } // for(const f ...)

    };

    async exportRoutingProfiles(rpList, qList) {

        const filtered = this.#applyFilters(rpList, release['routing-profiles']);
        if (filtered?.length < 1) return;

        const qMap = ConnectWrapper.toMap(qList, true); // map by qid
        const dir = join(this.#outputDir, 'routing-profiles');
        mkdir(dir);

        for (const rp of filtered) {

            const data = await this.#connect.describeRoutingProfile(rp.Id);
            const fileName = join(dir, `${data.Name}.json`);
            const profile = {
                Name: data.Name,
                Media: data.MediaConcurrencies,
                OutboundQueue: qMap.get(data.DefaultOutboundQueueId),
                Tags: data.Tags || {}
            };

            if (data.Description) {
                profile.Description = data.Description;
            }

            profile.Queues = (await this.#connect.listRoutingProfileQueues(rp.Id)).map((q) => {
                return {
                    QueueName: q.QueueName,
                    Channel: q.Channel,
                    Priority: q.Priority,
                    Delay: q.Delay
                };
            });

            fs.writeFileSync(fileName, JSON.stringify(profile, null, 2));  // write to local disk
            console.log(`CxExporter.exportRoutingProfiles: Exported [${data.Name}]`);

        } // for(const f ...)

    };

    async exportSecurityProfiles() {

        const spList = await this.#connect.listSecurityProfiles();
        const filtered = this.#applyFilters(spList, release['security-profiles']);
        if (filtered?.length < 1) return;

        const dir = join(this.#outputDir, 'security-profiles');
        mkdir(dir);

        for (const sp of filtered) {
            const profile = await this.#connect.describeSecurityProfile(sp.Id);
            const permissions = await this.#connect.listSecurityProfilePermissions(sp.Id);
            const fileName = join(dir, `${sp.Name}.json`);
            fs.writeFileSync(fileName, JSON.stringify({
                Name: profile.SecurityProfileName,
                Description: profile.Description,
                Tags: profile.Tags || {},
                Permissions: permissions || [],
                TagRestrictedResources: profile.TagRestrictedResources,
                AllowedAccessControlTags: profile.AllowedAccessControlTags
            }, null, 2));  // write to local disk
            console.log(`CxExporter.exportSecurityProfiles: Exported [${sp.Name}]`);
        } // for(const sp ...)

    };

    async exportAgentStatuses() {

        const asList = await this.#connect.listAgentStatuses();
        const filtered = this.#applyFilters(asList, release['agent-statuses']);
        if (filtered?.length < 1) return;

        const dir = join(this.#outputDir, 'agent-statuses');
        mkdir(dir);

        for (const as of filtered) {
            const agentStatus = await this.#connect.describeAgentStatus(as.Id);
            const fileName = join(dir, `${as.Name}.json`);
            fs.writeFileSync(fileName, JSON.stringify({
                Name: agentStatus.Name,
                Description: agentStatus.Description,
                State: agentStatus.State,
                Type: agentStatus.Type,
                DisplayOrder: agentStatus.DisplayOrder,
                Tags: agentStatus.Tags
            }, null, 2));  // write to local disk
            console.log(`CxExporter.exportAgentStatuses: Exported [${as.Name}]`);
        } // for(const as ...)

    };

    async exportQuickConnects(qcList, fList, qList) {

        const filtered = this.#applyFilters(qcList, release['quick-connects']);
        if (filtered?.length < 1) return;

        const fMap = ConnectWrapper.toMap(fList, true);
        const qMap = ConnectWrapper.toMap(qList, true);
        const dir = join(this.#outputDir, 'quick-connects');
        mkdir(dir);

        for (const qc of filtered) {

            const data = await this.#connect.describeQuickConnect(qc.Id);
            const fileName = join(dir, `${data.Name}.json`);
            const quickConnect = {
                Name: data.Name,
                Type: data.QuickConnectConfig?.QuickConnectType
            };

            if (data.Description) {
                quickConnect.Description = data.Description;
            }

            if (quickConnect.Type === 'QUEUE') {
                quickConnect.Queue = qMap.get(data.QuickConnectConfig?.QueueConfig?.QueueId);
                quickConnect.Flow = fMap.get(data.QuickConnectConfig?.QueueConfig?.ContactFlowId);
            }

            if (quickConnect.Type === 'PHONE_NUMBER') {
                quickConnect.Number = data.QuickConnectConfig?.PhoneConfig?.PhoneNumber;
            }

            let content = JSON.stringify(quickConnect, null, 2);
            fs.writeFileSync(fileName, content);  // write to local disk
            console.log(`CxExporter.exportQuickConnects: Exported [${data.Name}]`);

        } // for(const f ...)

    };

    async #mapBotAliases() {

        const map = new Map();
        const bots = await this.#lex.listBots();

        // iterate through bot list
        for (let [key, value] of bots) {

            if (!key || !value) continue;
            const botId = value.botId;
            const botName = key;

            // for each bot, iterate through aliases
            const aliases = await this.#lex.listBotAliases(botId);
            for (let alias of aliases) {
                map.set(
                    `:bot-alias/${botId}/${alias.botAliasId}`,
                    `:bot-alias/${botName}/${alias.botAliasName}`
                );
            }
        }

        return map;
    }

    #mapOutboundConfigIds(config, phoneMap, flowMap) {

        const newConfig = {};
        if (config?.OutboundCallerIdName && typeof config.OutboundCallerIdName === 'string') {
            newConfig.OutboundCallerIdName = config.OutboundCallerIdName;
        }

        if (config?.OutboundCallerIdNumberId && typeof config.OutboundCallerIdNumberId === 'string') {
            const phoneNo = phoneMap.get(config.OutboundCallerIdNumberId);
            if (!phoneNo) throw new Error(`No phone number found for [${config.OutboundCallerIdNumberId}]`);
            newConfig.OutboundCallerIdNumberId = {
                "dev": phoneNo,
                "stg": "",
                "prod": ""
            }
        }

        if (config?.OutboundFlowId && typeof config.OutboundFlowId === 'string') {
            const flowName = flowMap.get(config.OutboundFlowId);
            if (!flowName) throw new Error(`No flow name found for [${config.OutboundFlowId}]`);
            newConfig.OutboundFlowId = flowName;
        }

        return newConfig;
    }

    #replaceIds(flow, idMap, resourceType) {

        if (!idMap || idMap.size < 1) return flow;

        if (typeof flow !== 'string' || flow.length < 1) throw new Error('Flow content is invalid or empty!');

        const validTypes = ['operating-hours', 'prompt', 'queue', 'contact-flow'];
        if (!validTypes.includes(resourceType)) throw new Error(`Invalid resourceType [${resourceType}]`);

        const pattern = `/${placeholders.INSTANCE}/${resourceType}/`;
        const patternLen = pattern.length;
        const replacements = new Map();
        let startIdx = 0;
        let endIdx = 0;

        do {

            let idIdx = flow.indexOf(pattern, startIdx);
            if (idIdx === -1) break;

            idIdx += patternLen;
            endIdx = flow.indexOf('\\', idIdx + 1);
            const id = flow.substring(idIdx, endIdx);

            if (!replacements.has(id)) {
                const name = idMap.get(id);
                replacements.set(id, name);
            }

            startIdx = endIdx + 1;

        } while (startIdx < flow.length);

        let format;
        switch (resourceType) {
            case 'operating-hours':
                format = `${placeholders.HOOP_PREFIX}VALUE${placeholders.HOOP_SUFFIX}`;
                break;
            case 'prompt':
                format = `${placeholders.PROMPT_PREFIX}VALUE${placeholders.PROMPT_SUFFIX}`;
                break;
            case 'queue':
                format = `${placeholders.QUEUE_PREFIX}VALUE${placeholders.QUEUE_SUFFIX}`;
                break;
            case 'contact-flow':
                format = `${placeholders.FLOW_PREFIX}VALUE${placeholders.FLOW_SUFFIX}`;
                break;
            default:
                throw new Error(`Unexpected resourceType [${resourceType}]`);
        }

        replacements.forEach((v, k) => {
            flow = flow.replaceAll(k, format.replace('VALUE', v));
        });

        return flow;
    }

    #replaceAssistantIds(flow, idMap) {

        if (!idMap || idMap.size < 1) return flow;

        if (typeof flow !== 'string' || flow.length < 1) throw new Error('Flow content is invalid or empty!');

        const regEx = /wisdom:\${REGION}:\${ACCT_ID}:assistant\/([a-z0-9-]+)/g;
        if (flow.match(regEx)) {
            const matches = [...flow.matchAll(regEx)];
            for (const match of matches) {
                // const placeholderValue = match[0];
                const id = match[1];

                const name = idMap.get(id);
                const placeholderValue = `${placeholders.ASSISTANT_PREFIX}${name}${placeholders.ASSISTANT_SUFFIX}`
                flow = flow.replace(id, placeholderValue);
            }
        }

        return flow;
    }

    #replaceModuleIds(flow, idMap) {
        if (idMap.size < 1) return flow;
        idMap.forEach((value, key) => {
            const placeholder = placeholders.MODULE_PREFIX + value + placeholders.MODULE_SUFFIX;
            flow = flow.replaceAll(key, placeholder);
        });
        return flow;
    }

    #replaceBotReferences(content, botMap) {
        if (botMap.size < 1) return content;
        botMap.forEach((value, key) => {
            content = content.replaceAll(key, value);
        });
        return content;
    }

    #applyFilters(list, filters) {
        if (!Array.isArray(list) || list.length < 1 || !Array.isArray(filters) || filters.length < 1) return list;
        const sorted = [...filters];
        sorted.sort();
        return list.filter(item => this.#filterByName(item.Name, sorted))
    }

    #filterByName(name, filters) {

        if (typeof name !== 'string' || name.length < 1) return false;

        // if no filters supplied, then accept
        const applyFilters = Array.isArray(filters) && filters.length > 0;
        if (!applyFilters) return true;

        // If explicitly excluded, then reject
        if (filters.includes(`!${name}`)) return false;

        // If explicitly included, then accept
        if (filters.includes(name)) return true;

        // If all excluded, then reject
        if (filters.length === 1 && filters.includes('!*')) return false;

        // check based on prefix
        for (let f of filters) {

            if (f === '*') return true;

            if (typeof f !== 'string' || f === '!*' || !f.endsWith('*')) continue;

            f = f.substring(0, f.length - 1);
            if (f.length < 1) continue;

            const isExclusion = f.startsWith('!');
            const prefix = isExclusion ? f.substring(1) : f;

            if (prefix.length < 1) continue;

            // reject based on prefix
            if (isExclusion && name.startsWith(prefix)) return false;

            // accept based on prefix
            if (name.startsWith(prefix)) return true;

        }

        // exclude by default
        return false;
    }

    #replaceLambdaStage(flow) {

        if (!flow || typeof flow !== 'string') throw new Error('Invalid flow content!');

        const stages = cdk?.context?.application?.environments?.map(env => env?.stage) || [];
        if (!stages || !Array.isArray(stages) || stages.length < 1) throw new Error('Stage array required!');

        const stagePattern = stages.map(s => `${s}-|-${s}-|-${s}`).join('|');
        const pattern = `arn:aws:lambda:${placeholders.REGION}:${placeholders.ACCOUNT}:function:`;
        const patternLen = pattern.length;
        const replacements = new Map();
        let startIdx = 0;
        let nameEndIdx = 0;

        do {

            let nameStartIdx = flow.indexOf(pattern, startIdx);
            if (nameStartIdx === -1) break;

            nameStartIdx += patternLen;
            nameEndIdx = flow.indexOf('\",', nameStartIdx + 1);
            startIdx = nameEndIdx + 1;

            const lambdaName = flow.substring(nameStartIdx, nameEndIdx - 1);
            const matches = lambdaName.match(stagePattern);
            if (!matches || matches.length < 1) continue;

            const match = matches[0] + '';
            if (match.startsWith('-') && match.endsWith('-')) {
                replacements.set(lambdaName, lambdaName.replace(match, `-${placeholders.STAGE}-`));
            } else if (match.startsWith('-')) {
                replacements.set(lambdaName, lambdaName.replace(match, `-${placeholders.STAGE}`));
            } else {
                replacements.set(lambdaName, lambdaName.replace(match, `${placeholders.STAGE}-`));
            }

        } while (startIdx < flow.length);

        if (replacements.length < 1) return flow;

        replacements.forEach((v, k) => {
            flow = flow.replaceAll(k, v);
        });

        return flow;
    }

} // class

module.exports = CxExporter;
