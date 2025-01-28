const {
    ConnectClient,
    ListAgentStatusesCommand,
    ListContactFlowsCommand,
    ListContactFlowModulesCommand,
    ListHoursOfOperationsCommand,
    ListPhoneNumbersCommand,
    ListPromptsCommand,
    ListQueuesCommand,
    ListQueueQuickConnectsCommand,
    ListQuickConnectsCommand,
    ListRoutingProfilesCommand,
    ListRoutingProfileQueuesCommand,
    ListSecurityProfilesCommand,
    ListSecurityProfilePermissionsCommand,
    DescribeAgentStatusCommand,
    DescribeContactFlowCommand,
    DescribeContactFlowModuleCommand,
    DescribeHoursOfOperationCommand,
    DescribeQueueCommand,
    DescribeQuickConnectCommand,
    DescribeRoutingProfileCommand,
    DescribeSecurityProfileCommand,
    QueueType
} = require('@aws-sdk/client-connect');

const FLOWS = 'FLOWS';
const HOOP = 'HOOP';
const QUEUES = 'QUEUES';
const MODULES = 'MODULES';
const ROUTING_PROFILES = 'ROUTING_PROFILES';
const SECURITY_PROFILES = 'SECURITY_PROFILES';
const SECURITY_PROFILE_PERMISSIONS = 'SECURITY_PROFILE_PERMISSIONS';
const ROUTING_PROFILE_QUEUES = 'ROUTING_PROFILE_QUEUES';
const PROMPTS = 'PROMPTS';
const QUICK_CONNECTS = 'QUICK_CONNECTS';
const QUEUE_QUICK_CONNECTS = 'QUEUE_QUICK_CONNECTS';
const PHONE_NUMBERS = 'PHONE_NUMBERS';
const AGENT_STATUSES = 'AGENT_STATUSES';

class ConnectWrapper {

    #connect;
    #instance;

    constructor(region, instance) {
        this.#connect = new ConnectClient({ region, maxAttempts: 25 });
        this.#instance = instance;
    }

    async #listResources(resourceType, params, respDataKey) {

        let nextToken;
        const list = [];

        do {
            // prepare request and send it
            const req = this.#getListCommand(resourceType, { ...params, NextToken: nextToken });
            const resp = await this.#connect.send(req);

            // check response
            const metadata = resp ? resp['$metadata'] : null;
            if(!metadata || metadata.httpStatusCode !== 200) {
                console.error(`List command failed. Status = [${metadata?.httpStatusCode}].`);
                throw new Error('No response from AWS');
            }

            // extract resource summary list
            const data = resp[respDataKey] || [];
            if(!Array.isArray(data) || data.length < 1) break;

            list.push(...data);
            nextToken = resp.NextToken;

        } while(nextToken);

        return list;
    }

    #getListCommand(resourceType, params) {
        switch(resourceType) {
            case FLOWS:
                return new ListContactFlowsCommand(params);
            case HOOP:
                return new ListHoursOfOperationsCommand(params);
            case QUEUES:
                return new ListQueuesCommand(params);
            case MODULES:
                return new ListContactFlowModulesCommand(params);
            case ROUTING_PROFILES:
                return new ListRoutingProfilesCommand(params);
            case SECURITY_PROFILES:
                return new ListSecurityProfilesCommand(params);
            case SECURITY_PROFILE_PERMISSIONS:
                return new ListSecurityProfilePermissionsCommand(params);
            case ROUTING_PROFILE_QUEUES:
                return new ListRoutingProfileQueuesCommand(params);
            case PROMPTS:
                return new ListPromptsCommand(params);
            case QUICK_CONNECTS:
                return new ListQuickConnectsCommand(params);
            case QUEUE_QUICK_CONNECTS:
                return new ListQueueQuickConnectsCommand(params);
            case PHONE_NUMBERS:
                return new ListPhoneNumbersCommand(params);
            case AGENT_STATUSES:
                return new ListAgentStatusesCommand(params);
            default:
                throw new Error(`Invalid Connect resource type [${resourceType}]`);                                                                        
        }
    }

    async listContactFlows() {
        return await this.#listResources(
            FLOWS,
            { InstanceId: this.#instance },
            'ContactFlowSummaryList'
        );
    }

    async describeContactFlow(id) {
        const data = await this.#connect.send(new DescribeContactFlowCommand({
            InstanceId: this.#instance,
            ContactFlowId: id
        }));
        return data.ContactFlow;
    }

    async listHoop() {
        return await this.#listResources(
            HOOP,
            { InstanceId: this.#instance },
            'HoursOfOperationSummaryList'
        );
    }

    async describeHoop(id) {
        const data = await this.#connect.send(new DescribeHoursOfOperationCommand({
            InstanceId: this.#instance,
            HoursOfOperationId: id
        }));
        return data.HoursOfOperation;
    }

    async listQueues() {
        return await this.#listResources(
            QUEUES,
            { InstanceId: this.#instance, QueueTypes: [ QueueType.STANDARD ] },
            'QueueSummaryList'
        );
    }

    async describeQueue(id) {
        const data = await this.#connect.send(new DescribeQueueCommand({
            InstanceId: this.#instance,
            QueueId: id
        }));
        return data.Queue;
    }

    async listContactFlowModules() {
        return await this.#listResources(
            MODULES,
            { InstanceId: this.#instance },
            'ContactFlowModulesSummaryList'
        );
    }

    async describeContactFlowModule(id) {
        const data = await this.#connect.send(new DescribeContactFlowModuleCommand({
            InstanceId: this.#instance,
            ContactFlowModuleId: id
        }));
        return data.ContactFlowModule;
    }

    async listRoutingProfiles() {
        return await this.#listResources(
            ROUTING_PROFILES,
            { InstanceId: this.#instance },
            'RoutingProfileSummaryList'
        );
    }

    async describeRoutingProfile(id) {
        const data = await this.#connect.send(new DescribeRoutingProfileCommand({
            InstanceId: this.#instance,
            RoutingProfileId: id
        }));
        return data.RoutingProfile;
    }

    async listSecurityProfiles() {
        return await this.#listResources(
            SECURITY_PROFILES,
            { InstanceId: this.#instance },
            'SecurityProfileSummaryList'
        );
    }

    async listSecurityProfilePermissions(profileId) {
        return await this.#listResources(
            SECURITY_PROFILE_PERMISSIONS,
            { InstanceId: this.#instance, SecurityProfileId: profileId },
            'Permissions'
        );
    }

    async describeSecurityProfile(id) {
        const data = await this.#connect.send(new DescribeSecurityProfileCommand({
            InstanceId: this.#instance,
            SecurityProfileId: id
        }));
        return data.SecurityProfile;
    }

    async listRoutingProfileQueues(id) {
        return await this.#listResources(
            ROUTING_PROFILE_QUEUES,
            { InstanceId: this.#instance, RoutingProfileId: id },
            'RoutingProfileQueueConfigSummaryList'
        );
    }

    async listPrompts() {
        return await this.#listResources(
            PROMPTS,
            { InstanceId: this.#instance },
            'PromptSummaryList'
        );
    }

    async listQuickConnects() {
        return await this.#listResources(
            QUICK_CONNECTS,
            { InstanceId: this.#instance, QuickConnectTypes: ['QUEUE', 'PHONE_NUMBER'] },
            'QuickConnectSummaryList'
        );
    }

    async listQueueQuickConnects(qid) {
        const data = await this.#listResources(
            QUEUE_QUICK_CONNECTS,
            { InstanceId: this.#instance, QueueId: qid },
            'QuickConnectSummaryList'
        );
        return data.filter(qc => ['QUEUE', 'PHONE_NUMBER'].includes(qc.QuickConnectType));
    }

    async describeQuickConnect(id) {
        const data = await this.#connect.send(new DescribeQuickConnectCommand({
            InstanceId: this.#instance,
            QuickConnectId: id
        }));
        return data.QuickConnect;
    }

    async listPhoneNumbers() {
        return await this.#listResources(
            PHONE_NUMBERS,
            { InstanceId: this.#instance },
            'PhoneNumberSummaryList'
        );
    }

    async listAgentStatuses() {
        return await this.#listResources(
            AGENT_STATUSES,
            { InstanceId: this.#instance },
            'AgentStatusSummaryList'
        );
    }

    async describeAgentStatus(id) {
        const data = await this.#connect.send(new DescribeAgentStatusCommand({
            InstanceId: this.#instance,
            AgentStatusId: id
        }));
        return data.AgentStatus;
    }

    static toMap(summaryList, byId = false) {

        const map = new Map();
        if(!summaryList) return map;

        for(const s of summaryList) {
            if(!s?.Name || !s.Id) continue;
            byId ? map.set(s.Id, s.Name) : map.set(s.Name, s.Id);
        }
        return map;
    }

} // class

module.exports = ConnectWrapper;