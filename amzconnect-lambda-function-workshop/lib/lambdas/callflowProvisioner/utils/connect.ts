import {
    ConnectClient,
    ContactFlow,
    ContactFlowModuleSummary,
    ContactFlowSummary,
    CreateContactFlowCommand,
    CreateContactFlowModuleCommand,
    ListContactFlowsCommand,
    ListContactFlowModulesCommand,
    ListPromptsCommand,
    ListQueuesCommand,
    PromptSummary,
    QueueSummary,
    UpdateContactFlowContentCommand,
    UpdateContactFlowModuleContentCommand,
    UpdateContactFlowModuleMetadataCommand,
    UpdateContactFlowMetadataCommand
} from "@aws-sdk/client-connect";
import { Logger} from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { StringAttributeConstraints } from "aws-cdk-lib/aws-cognito";

const tracer = new Tracer({ serviceName: "provisioner" });
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner" });
const region = process.env.AWS_REGION;

const connectClient = tracer.captureAWSv3Client(new ConnectClient({ region: region }));

export const createContactFlow = async (
    Name: string,
    INSTANCE_ID: string,
    Type: string,
    Content: string,
    Tags: {},
    Description?: string,
) => {
    const createCommand = new CreateContactFlowCommand({
        Name: Name,
        InstanceId: INSTANCE_ID,
        Type: Type,
        Content: Content,
        Tags: Tags,
        Description: Description,
    });
    logger.info(`Adding ${Name}`)
    let resp = await connectClient.send(createCommand);
    logger.info(`response ${JSON.stringify(resp, null, 2)}`);
    return resp
};

export const createContactFlowModule = async (
    Name: string,
    INSTANCE_ID: string,
    Content: string,
    Tags: {},
    Description?: string,
) => {
    const createCommand = new CreateContactFlowModuleCommand({
        Name: Name,
        InstanceId: INSTANCE_ID,
        Content: Content,
        Tags: Tags,
        Description: Description,
    });
    logger.info(`Adding ${Name}`)
    let resp = await connectClient.send(createCommand);
    logger.info(`response ${JSON.stringify(resp, null, 2)}`);
    return resp
};

export const updateContactFlow = async (flowId: string, INSTANCE_ID: string, flow: string) => {
    const updateCommand = new UpdateContactFlowContentCommand({
        ContactFlowId: flowId,
        Content: flow,
        InstanceId: INSTANCE_ID,
    });
    return await connectClient.send(updateCommand);
};

export const updateContactFlowModule = async (moduleId: string, INSTANCE_ID: string, content: string) => {
    const updateCommand = new UpdateContactFlowModuleContentCommand({
        ContactFlowModuleId: moduleId,
        Content: content,
        InstanceId: INSTANCE_ID,
    });
    return await connectClient.send(updateCommand);
};

export async function listContactFlows(INSTANCE_ID: string) {
    let nextToken: string | undefined;
    const flows: ContactFlowSummary[] = [];

    do {
        const resp = await connectClient.send(
                new ListContactFlowsCommand({
                    InstanceId: INSTANCE_ID,
                    NextToken: nextToken,
                }),
            );

        const data = resp?.ContactFlowSummaryList || [];
        if (data.length < 1) break;
        nextToken = resp?.NextToken;
        flows.push(...data);
    } while (nextToken);

    console.log(
        `ConnectReader.listContactFlows: Found ${flows.length} contact flows`,
    );
    return flows;
}

export async function listContactFlowModules(INSTANCE_ID: string) {
    let nextToken: string | undefined;
    const flows: ContactFlowModuleSummary[] = [];

    do {
        const resp = await connectClient.send(
            new ListContactFlowModulesCommand({
                InstanceId: INSTANCE_ID,
                NextToken: nextToken,
                ContactFlowModuleState: "ACTIVE" 
            }),
        );

        const data = resp?.ContactFlowModulesSummaryList || [];
        if (data.length < 1) break;
        nextToken = resp?.NextToken;
        flows.push(...data);
    } while (nextToken);

    console.log(
        `ConnectReader.listContactFlowModules: Found ${flows.length} contact flow modules`,
    );
    return flows;
}

export async function listQueues(INSTANCE_ID: string) {
    const localMap = new Map();
    let nextToken: string | undefined;
    const queues: QueueSummary[] = []
    try {
        do {
            const lqList = new ListQueuesCommand({ InstanceId: INSTANCE_ID, NextToken: nextToken  });
            const resp = await connectClient.send(lqList);
            const data = resp?.QueueSummaryList || []
            if(data.length < 1) break;
            nextToken = resp?.NextToken;
            queues.push(...data);
        } while(nextToken);
        logger.info(`Connect.listQueues: Found ${queues.length}`);
        for (const p of queues) {
            localMap.set(p.Name, p.Arn);
        }
    } catch (error) {
        logger.error("Connect.listQueues error: ", error as Error);
        throw error;
    }
    logger.info("Connect.listQueues: ", {log_detail: Object.fromEntries(localMap)})
    return localMap
}

export async function listPrompts(INSTANCE_ID: string) {
    const localMap = new Map();
    let nextToken: string | undefined;
    const prompts: PromptSummary[] = []
    try {
        do {
            const pList = new ListPromptsCommand({ InstanceId: INSTANCE_ID, NextToken: nextToken  });
            const resp = await connectClient.send(pList);
            const data = resp?.PromptSummaryList || []
            if(data.length < 1) break;
            nextToken = resp?.NextToken;
            prompts.push(...data);
        } while(nextToken);
        logger.info(`Connect.listQueues: Found ${prompts.length}`);
        for (const p of prompts) {
            let stripName = p.Name.split(".");
            localMap.set(stripName[0], p.Arn);
        }
    } catch (error) {
        logger.error("Connect.listPrompts error", error as Error);
        throw error;
    }
    return localMap
}

export async function UpdateContactFlowMetadata(INSTANCE_ID: string, FLOW: ContactFlow) {
    const updateMetadataCommand = new UpdateContactFlowMetadataCommand({
        ContactFlowId: FLOW.Id,
        Name: `z_${FLOW.Name}`,
        Description: "Orphaned Flow",
        ContactFlowState: "ARCHIVED",
        InstanceId: INSTANCE_ID,
    });
    logger.info(`Connect.UpdateContactFlowMetadata: Updating ${FLOW.Name}`);
    await connectClient.send(updateMetadataCommand);
    logger.info(`Connect.UpdateContactFlowMetadata: ${FLOW.Name} renamed and archived`);
}

export async function UpdateContactFlowModuleMetadata(INSTANCE_ID: string, FLOW: ContactFlow) {
    const updateMetadataCommand = new UpdateContactFlowModuleMetadataCommand({
        ContactFlowModuleId: FLOW.Id,
        Name: `z_${FLOW.Name}`,
        Description: "Orphaned Flow Module",
        State: "ARCHIVED",
        InstanceId: INSTANCE_ID,
    });
    logger.info(`Connect.UpdateContactFlowModuleMetadata: Updating ${FLOW.Name}`);
    await connectClient.send(updateMetadataCommand);
    logger.info(`Connect.UpdateContactFlowModuleMetadata: ${FLOW.Name} renamed and archived`);
}