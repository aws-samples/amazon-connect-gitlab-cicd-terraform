import {
    ContactFlow,
    ContactFlowModule,
} from "@aws-sdk/client-connect";
import { Context } from "aws-lambda";
import middy from "@middy/core";
import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
import { Tracer, captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import {
    Metrics,
    MetricUnits,
    logMetrics,
} from "@aws-lambda-powertools/metrics";
import { getParameter } from "@aws-lambda-powertools/parameters/ssm";
import { readTextFile, getS3Contents, getS3Flows, getS3FlowModules } from "./utils/s3";
import {
    listContactFlows,
    listContactFlowModules,
    listQueues
} from "./utils/connect";
import {
    getContactFlowsToAdd,
    getContactFlowModulesToAdd,
    createContactFlows,
    createContactFlowModules,
    handleOrphanedFlows,
    handleOrphanedFlowModules,
    getFlowsToUpdate,
    getFlowModulesToUpdate,
    buildConnectObject,
    buildTotalConnectObject,
    handleContactFlowReplacements,
    handleContactFlowModuleReplacements,
    connectGetFullInventory
} from "./managers";


// Environment Variables
const region = process.env.AWS_REGION;
const env = process.env.FUNCTION_ENV;
// ! Note: app and capability are interchangeable conceptually. Need to migrate terminology. app only potentially used by lex
const app = process.env.FUNCTION_APP;
const account = process.env.FUNCTION_ACCOUNT;
const bucketName = process.env.BUCKET;

const tracer = new Tracer({ serviceName: "provisioner" });
const logger = new Logger({ serviceName: "provisioner" });
const metrics = new Metrics({
    namespace: "provisionerLambda",
    serviceName: "invocations",
});


const regionShortNames = new Map([
    ["us-east-1", "use1"],
    ["us-west-2", "usw2"],
]);

type LambdaInvokeEvent = {
    ivr_id: string;
    capability_id: string;
};

const lambdaHandler = async (
    _event: LambdaInvokeEvent,
    _context: Context,
): Promise<string> => {
    // eslint-disable-line @typescript-eslint/no-unused-vars

    //* Get mapping function name and ARN from SSM parameter store
    const IVR_ID = _event.ivr_id;
    const CAPABILITY_ID = _event.capability_id;
    const SSM_PREFIX = `/${env}/${regionShortNames.get(region)}/${IVR_ID}`;
    const NAMING_PREFIX = `${IVR_ID}-${CAPABILITY_ID}`;
    logger.appendKeys({
        capability_id: `${CAPABILITY_ID}`,
        ivr_id: `${IVR_ID}`
    })
    const INSTANCE_ID = await getParameter(
        `${SSM_PREFIX}/amz-connect-instance-id`,
    );
    const _disconnectParticipant = await readTextFile(
        bucketName,
        `templates/disconnectParticipant.json`,
    );
    const _endFlowExecution_whisper_queue = await readTextFile(
        bucketName,
        `templates/EndFlowExecution_whisper_queue.json`,
    );
    const _messageParticipantIteratively_holds = await readTextFile(
        bucketName,
        `templates/messageParticipantIteratively_holds.json`,
    );
    const _endFlowModuleExecution = await readTextFile(
        bucketName,
        `templates/endFlowModuleExecution.json`,
    );

    const S3_CONTENTS = await getS3Contents(bucketName, IVR_ID, CAPABILITY_ID);
    logger.info(`getS3Contents.S3_CONTENTS:`, {
        log_detail: S3_CONTENTS.map((o) => {
            return o.Name;
        }),
    });
    //* Get contact flows and flow modules that exist on Connect Instance
    const S3_FLOWS = await getS3Flows(S3_CONTENTS)
    const S3_FLOW_MODULES = await getS3FlowModules(S3_CONTENTS)
    
    const S3_FLOWS_FILTERED_BY_CAP_ID = S3_FLOWS.filter(
        (o) => o.Name.startsWith(`${CAPABILITY_ID}_`) && o.Type != undefined,
    );
    const S3_FLOW_MODULES_FILTERED_BY_CAP_ID = S3_FLOW_MODULES.filter((o) =>
        o.Name.startsWith(`${CAPABILITY_ID}_`),
    );

    const connectMgrMapFull = await connectGetFullInventory(INSTANCE_ID, NAMING_PREFIX, CAPABILITY_ID, IVR_ID);
    logger.info("connectGetFullInventory", {log_detail: Object.fromEntries(connectMgrMapFull)})

    const CONTACT_FLOWS_TO_ADD = await getContactFlowsToAdd(
        INSTANCE_ID,
        CAPABILITY_ID,
        S3_CONTENTS,
    );
    logger.debug("Index.CONTACT_FLOWS_TO_ADD", { log_detail: CONTACT_FLOWS_TO_ADD });

    const CONTACT_FLOW_MODULES_TO_ADD = await getContactFlowModulesToAdd(
        INSTANCE_ID,
        CAPABILITY_ID,
        S3_CONTENTS,
    );
    logger.debug("Index.CONTACT_FLOW_MODULES_TO_ADD", {
        log_detail: CONTACT_FLOW_MODULES_TO_ADD,
    });

    await createContactFlows(
        INSTANCE_ID,
        IVR_ID,
        CONTACT_FLOWS_TO_ADD,
        _endFlowExecution_whisper_queue,
        _disconnectParticipant,
        _messageParticipantIteratively_holds,
    );
    await createContactFlowModules(
        INSTANCE_ID,
        IVR_ID,
        CONTACT_FLOW_MODULES_TO_ADD,
        _endFlowModuleExecution,
    );

    //* Retrieve complete list of contact flows and flow modules

    const COMPLETE_INST_SUMM_LIST = await listContactFlows(INSTANCE_ID);
    let summaryListNames2 = COMPLETE_INST_SUMM_LIST.map((o: ContactFlow) => {
        return o.Name;
    });
    console.log(
        "Flows provisioned on instance after creation of new flows from S3",
        summaryListNames2.sort(),
    );

    const COMPLETE_INST_MODULE_SUMM_LIST =
        await listContactFlowModules(INSTANCE_ID);
    let summaryModuleListNames2 = COMPLETE_INST_MODULE_SUMM_LIST.map(
        (o: ContactFlowModule) => {
            return o.Name;
        },
    );
    console.log(
        "Contact Flow Modules provisioned on instance after creation of new flow modules from S3",
        summaryModuleListNames2.sort(),
    );
    // * Rename and Archive Orphaned Flows
    await handleOrphanedFlows(COMPLETE_INST_SUMM_LIST, CAPABILITY_ID, INSTANCE_ID, S3_FLOWS)
    await handleOrphanedFlowModules(COMPLETE_INST_MODULE_SUMM_LIST, CAPABILITY_ID, INSTANCE_ID, S3_FLOW_MODULES)

    const INST_SUMM_LIST_DEFAULT_FLOWS = COMPLETE_INST_SUMM_LIST.filter(
        (o: ContactFlow) => o.Name.startsWith(`Default`),
    );

    const connectObjMapTotal = await buildTotalConnectObject(
        INSTANCE_ID, 
        NAMING_PREFIX,
        CAPABILITY_ID,
        IVR_ID,
        COMPLETE_INST_SUMM_LIST,
        COMPLETE_INST_MODULE_SUMM_LIST,
        S3_FLOWS,
        S3_FLOW_MODULES,
        INST_SUMM_LIST_DEFAULT_FLOWS
    )
    logger.info("connectObjMapTotal", {log_detail: Object.fromEntries(connectObjMapTotal)})

    const connectObjMap = await buildConnectObject(
        INSTANCE_ID, 
        NAMING_PREFIX,
        CAPABILITY_ID,
        IVR_ID,
        COMPLETE_INST_SUMM_LIST,
        COMPLETE_INST_MODULE_SUMM_LIST,
        S3_FLOWS,
        S3_FLOW_MODULES,
        INST_SUMM_LIST_DEFAULT_FLOWS
    )

    const FLOWS_TO_UPDATE = await getFlowsToUpdate(
        COMPLETE_INST_SUMM_LIST,
        CAPABILITY_ID,
        S3_FLOWS,
        S3_FLOWS_FILTERED_BY_CAP_ID
    )
    
    const FLOW_MODULES_TO_UPDATE = await getFlowModulesToUpdate(
        COMPLETE_INST_MODULE_SUMM_LIST,
        CAPABILITY_ID,
        S3_FLOW_MODULES,
        S3_FLOW_MODULES_FILTERED_BY_CAP_ID
    )

    const connectObject = Object.fromEntries(connectObjMap);
    logger.info(`connectObject: `, {connectObject: connectObject});
    const connectObjectSize = Buffer.byteLength(JSON.stringify(connectObject))
    if (connectObjectSize < 32000) {
        logger.info(`Connect Object/Flow Object Maps has ${Object.keys(connectObject).length} items and ${Buffer.byteLength(JSON.stringify(connectObject))} bytes: `)
    } else {
        logger.error(`Connect Object/Flow Object Maps is too large and dropping attributes! It is ${Object.keys(connectObject).length} items and ${Buffer.byteLength(JSON.stringify(connectObject))} bytes: `)
    }
    //* Update all flows from S3 with latest flow content
    //* Replace fields in flows that need replacing.

    await handleContactFlowReplacements(
        FLOWS_TO_UPDATE,
        INSTANCE_ID,
        connectObject,
        connectObjMapTotal
    )
    
    await handleContactFlowModuleReplacements(
        FLOW_MODULES_TO_UPDATE,
        INSTANCE_ID,
        connectObject,
        connectObjMapTotal
    )

    logger.info(`Provisioning Complete for ${CAPABILITY_ID} on ${IVR_ID}`);
    metrics.addMetric("Successful Invocation", MetricUnits.Count, 1);
    metrics.addMetric(`${CAPABILITY_ID} Invocation`, MetricUnits.Count, 1);
    metrics.addMetric(`${IVR_ID} Invocation`, MetricUnits.Count, 1);
    return `Provisioning Complete for ${CAPABILITY_ID} on ${IVR_ID}`;
};

export const handler = middy(lambdaHandler)
    .use(injectLambdaContext(logger, { logEvent: true }))
    .use(logMetrics(metrics))
    .use(captureLambdaHandler(tracer));
