import {
    UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda";
import { Upload } from "@aws-sdk/lib-storage";
import {
    ContactFlow,
    ContactFlowModule,
    ContactFlowSummary,
    ContactFlowModuleSummary,
    ContactFlowModuleState,
    UpdateContactFlowMetadataCommand
} from "@aws-sdk/client-connect";
import { Logger } from "@aws-lambda-powertools/logger";
import {
    createContactFlow,
    createContactFlowModule,
    updateContactFlow,
    updateContactFlowModule,
    listContactFlows,
    listContactFlowModules,
    listQueues,
    listPrompts,
    UpdateContactFlowMetadata,
    UpdateContactFlowModuleMetadata,
} from "./utils/connect";
import {
    mergeContactFlowArrays,
    // modifyResiliencyToQueues,
    reMapObjectToFlowAtt
} from "./utils/contactflow";
import {
    ReplacementEngine,
    FunctionObjectMapsReplacer,
    PromptReplacer,
    QueueReplacer,
    FunctionReplacer,
    FlowReplacer
} from "./utils/replacements"
import { createFile, validateFlowVars } from "./utils/misc";
import { listLexBots } from "./utils/lex";
import { listLambdaFunctions } from "./utils/lambda";
import { readTextFile } from "./utils/s3";
import { getConnectClient, getS3Client, getLambdaClient } from "./utils/aws";
import { js_beautify } from "js-beautify";
import fs from "fs";
import JSZip, { forEach } from "jszip";


const region = process.env.AWS_REGION;
const env = process.env.FUNCTION_ENV;
// ! Note: app and capability are interchangeable conceptually. Need to migrate terminology. app only potentially used by lex
const account = process.env.FUNCTION_ACCOUNT;
const bucketName = process.env.BUCKET;
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner" });

const managerObjMap = new Map();

export async function connectGetInventory(
    INSTANCE_ID: string,
    NAMING_PREFIX: string,
    CAPABILITY_ID: string, 
    IVR_ID: string
) {
    const localQueueMap = await listQueues(INSTANCE_ID);
    for (let entry of localQueueMap.entries()) {
        managerObjMap.set(entry[0], entry[1]);
    }

    const localPromptMap = await listPrompts(INSTANCE_ID);
    for (let entry of localPromptMap.entries()) {
        managerObjMap.set(entry[0], entry[1]);
    }

    const localLexMap = await listLexBots(INSTANCE_ID, NAMING_PREFIX, CAPABILITY_ID);
    for (let entry of localLexMap.entries()) {
        managerObjMap.set(entry[0], entry[1]);
    }

    const localLambdaMap = await listLambdaFunctions(
        INSTANCE_ID,
        NAMING_PREFIX,
        CAPABILITY_ID,
        IVR_ID
    );
    for (let entry of localLambdaMap.entries()) {
        managerObjMap.set(entry[0], entry[1]);
    }

    return managerObjMap;
}

export async function connectGetFullInventory(
    INSTANCE_ID: string,
    NAMING_PREFIX: string,
    CAPABILITY_ID: string,
    IVR_ID: string
) {
    const managerObjMapFull = new Map();

    const localQueueMap = await listQueues(INSTANCE_ID);
    for (let entry of localQueueMap.entries()) {
        managerObjMapFull.set(entry[0], entry[1]);
    }

    const localPromptMap = await listPrompts(INSTANCE_ID);
    for (let entry of localPromptMap.entries()) {
        managerObjMapFull.set(entry[0], entry[1]);
    }

    const localLexMap = await listLexBots(INSTANCE_ID, NAMING_PREFIX, CAPABILITY_ID);
    for (let entry of localLexMap.entries()) {
        managerObjMapFull.set(entry[0], entry[1]);
    }

    const localLambdaMap = await listLambdaFunctions(
        INSTANCE_ID,
        NAMING_PREFIX,
        CAPABILITY_ID,
        IVR_ID,
        "ALL"
    );
    for (let entry of localLambdaMap.entries()) {
        managerObjMapFull.set(entry[0], entry[1]);
    }

    return managerObjMapFull;
}



export async function getContactFlowsToAdd(
    INSTANCE_ID: string,
    CAPABILITY_ID: string,
    S3_CONTENTS: ContactFlow[],
) {
    //* Get contact flows and flow modules that exist on Connect Instance

    const INST_CONTACT_FLOWS = await listContactFlows(INSTANCE_ID);
    logger.info("Managers.getContactFlowsToAdd: INST_CONTACT_FLOWS (currently on Instance)", {
        log_detail: INST_CONTACT_FLOWS.map((o) => {
            return o.Name;
        }),
    });

    //* Get contact flows and flow modules that exist in S3

    const S3_FLOWS = S3_CONTENTS.filter((o) => o.Type != undefined);
    logger.info("Managers.getContactFlowsToAdd: S3_FLOWS (Currently in S3)", {
        log_detail: S3_FLOWS.map((o) => {
            return o.Name;
        }),
    });
    // *
    // * Filter S3_CONTENTS that are in S3 however not present on Connect instance. This needs to be specific to the capability as s3 will
    // * contain all flows for each ivr_id, and we are only concerned with provisioning by capability.
    // *
    const S3_FLOWS_FILTERED_BY_CAP_ID = S3_FLOWS.filter((o) =>
        o.Name.startsWith(`${CAPABILITY_ID}_`),
    );
    // *
    // * the filter below is looking for S3_FLOWS_FILTERED_BY_CAP_ID that are NOT installed on instance
    // *
    const _cf = S3_FLOWS_FILTERED_BY_CAP_ID.filter(
        (o) => !INST_CONTACT_FLOWS.some((i: ContactFlow) => i.Name === o.Name),
    );

    const NEW_CONTACT_FLOWS = _cf.map((o) => {
        return {
            Name: o.Name,
            Type: o.Type,
            Description: o.Description,
            Tags: o.Tags,
        };
    });
    logger.info(
        `Managers.getContactFlowsToAdd: Flows within capability not present on Connect instance (i.e. New): `,
        {
            log_detail: NEW_CONTACT_FLOWS.map((o) => {
                return o.Name;
            }),
        },
    );
    return NEW_CONTACT_FLOWS;
}

export async function getContactFlowModulesToAdd(
    INSTANCE_ID: string,
    CAPABILITY_ID: string,
    S3_CONTENTS: ContactFlow[],
) {
    //* Get contact flows and flow modules that exist on Connect Instance

    let INST_CONTACT_FLOW_MODULES = await listContactFlowModules(INSTANCE_ID);
    logger.info(
        "Managers.getContactFlowModulesToAdd: INST_CONTACT_FLOW_MODULES (currently on Instance)",
        {
            log_detail: INST_CONTACT_FLOW_MODULES.map((o) => {
                return o.Name;
            }),
        },
    );

    //* Get contact flows and flow modules that exist in S3

    const S3_FLOW_MODULES = S3_CONTENTS.filter((o) => o.Type == undefined);

    logger.info("Managers.getContactFlowModulesToAdd: S3_FLOW_MODULES (Currently in S3)", {
        log_detail: S3_FLOW_MODULES.map((o) => {
            return o.Name;
        }),
    });

    // *
    // * Filter S3_CONTENTS that are in S3 however not present on Connect instance. This needs to be specific to the capability as s3 will
    // * contain all flows for each ivr_id, and we are only concerned with provisioning by capability.
    // *
    const S3_FLOW_MODULES_FILTERED_BY_CAP_ID = S3_FLOW_MODULES.filter((o) =>
        o.Name.startsWith(`${CAPABILITY_ID}_`),
    );
    // *
    // * the filter below is looking for S3_FLOWS_FILTERED_BY_CAP_ID that are NOT installed on instance
    // *
    let _cfm = S3_FLOW_MODULES_FILTERED_BY_CAP_ID.filter(
        (o) =>
            !INST_CONTACT_FLOW_MODULES.some(
                (i: ContactFlowModule) => i.Name === o.Name,
            ),
    );
    const NEW_CONTACT_FLOW_MODULES = _cfm.map((o) => {
        return {
            Name: o.Name,
            Description: o.Description,
            Tags: o.Tags,
        };
    });
    console.log(
        `Managers.getContactFlowModulesToAdd: Flow Modules within capability not present on Connect instance (i.e. New): `,
        NEW_CONTACT_FLOW_MODULES.map((o) => {
            return o.Name;
        }),
    );
    return NEW_CONTACT_FLOW_MODULES;
}

export async function createContactFlows(
    INSTANCE_ID: string,
    IVR_ID: string,
    CONTACT_FLOWS_TO_ADD: {
        Name: string;
        Type: string;
        Description: string;
        Tags: Record<string, string>;
    }[],
    _endFlowExecution_whisper_queue: string,
    _disconnectParticipant: string,
    _messageParticipantIteratively_holds: string,
) {
    for (const flow of CONTACT_FLOWS_TO_ADD) {
        logger.info(`Managers.createContactFlows: Adding ${flow.Name}`)
        if (flow.Type.includes("_WHISPER")) {
            const createCFResponse = await createContactFlow(
                flow.Name,
                INSTANCE_ID,
                flow.Type,
                _endFlowExecution_whisper_queue,
                { pipeline_provisioned: IVR_ID, ...flow.Tags },
                flow.Description || "Deployed via Automation",
            );
        } else if (flow.Type.includes("_HOLD")) {
            const createCFResponse = await createContactFlow(
                flow.Name,
                INSTANCE_ID,
                flow.Type,
                _messageParticipantIteratively_holds,
                { pipeline_provisioned: IVR_ID, ...flow.Tags },
                flow.Description || "Deployed via Automation",
            );
        } else {
            const createCFResponse = await createContactFlow(
                flow.Name,
                INSTANCE_ID,
                flow.Type,
                _disconnectParticipant,
                { pipeline_provisioned: IVR_ID, ...flow.Tags },
                flow.Description || "Deployed via Automation",
            );
        }
    }
}

export async function createContactFlowModules(
    INSTANCE_ID: string,
    IVR_ID: string,
    CONTACT_FLOW_MODULES_TO_ADD: {
        Name: string;
        Description: string;
        Tags: Record<string, string>;
    }[],
    _endFlowModuleExecution: string,
) {
    for (const flow of CONTACT_FLOW_MODULES_TO_ADD) {
        logger.info(`Managers.createContactFlowModules: Adding ${flow.Name}`)
        const createCFResponse = await createContactFlowModule(
            flow.Name,
            INSTANCE_ID,
            _endFlowModuleExecution,
            { pipeline_provisioned: IVR_ID, ...flow.Tags },
            flow.Description || "Deployed via Automation",
        );
    }
}

export async function handleOrphanedFlows(
    COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
    CAPABILITY_ID: string,
    INSTANCE_ID: string,
    S3_FLOWS: ContactFlowSummary[],
) {
    const COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID =
        COMPLETE_INST_SUMM_LIST.filter((o: ContactFlow) =>
            o.Name.startsWith(`${CAPABILITY_ID}_`),
        );
    logger.debug(
        "Managers.handleOrphanedFlows: COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID",
        { log_detail: COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID}
    );

    //* Map S3_CONTENTS on Connect instance not present in S3 (orphaned S3_CONTENTS). Future functionality to delete these. Currently we archive.
    const ORPHANED_FLOWS =
        COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID.filter(
            (o: ContactFlow) => !S3_FLOWS.some((i) => i.Name === o.Name),
        );
    logger.info(
        `Managers.handleOrphanedFlows: Array of Orphaned Flows on Connect instance within capability but not present in S3/Source Repository:`,
        { log_detail: ORPHANED_FLOWS}
    );

    try {
        for (const uflow of ORPHANED_FLOWS) {
            await UpdateContactFlowMetadata(INSTANCE_ID, uflow)
        }
    } catch (error) {
        logger.error("Error renaming flows", error as Error);
        throw error;
    }
}

export async function handleOrphanedFlowModules(
    COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
    CAPABILITY_ID: string,
    INSTANCE_ID: string,
    S3_FLOW_MODULES: ContactFlowModuleSummary[],
) {
    const COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID =
        COMPLETE_INST_MODULE_SUMM_LIST.filter((o: ContactFlow) =>
            o.Name.startsWith(`${CAPABILITY_ID}_`),
        );
    logger.info(
        "Managers.handleOrphanedFlowModules: COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID",
        { log_detail: COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID}
    );

    //* Map S3_CONTENTS on Connect instance not present in S3 (orphaned S3_CONTENTS). Future functionality to delete these. Currently we archive.
    const ORPHANED_MODULES =
        COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID.filter(
            (o: ContactFlowModule) =>
                !S3_FLOW_MODULES.some((i) => i.Name === o.Name),
        );
    logger.info(
        `Managers.handleOrphanedFlowModules: Array of Orphaned Flow Modules on Connect instance within capability but not present in S3/Source Repository:`,
        { log_detail: ORPHANED_MODULES }
    );

    try {
        for (const uflow of ORPHANED_MODULES) {
            await UpdateContactFlowModuleMetadata(INSTANCE_ID, uflow)
        }
    } catch (error) {
        logger.error("Error renaming flows", error as Error);
        throw error;
    }
}

export async function getFlowsProvisionedByAutomation(
    COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
){
    const COMPLETE_INST_SUMM_LIST_FILTERED_AUTO =
        COMPLETE_INST_SUMM_LIST.filter((o: ContactFlow) =>
            o.Name.endsWith(`_AUTO`),
        );
    logger.info(
        `Managers.getFlowsProvisionedByAutomation: COMPLETE_INST_SUMM_LIST_FILTERED_AUTO (Flows provisioned via automation)`,
        { log_detail: COMPLETE_INST_SUMM_LIST_FILTERED_AUTO.map((o: ContactFlow) => {
            return o.Name;
        })}
    );
    return COMPLETE_INST_SUMM_LIST_FILTERED_AUTO
}

export async function getFlowModulesProvisionedByAutomation(
    COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
){
    const COMPLETE_INST_SUMM_LIST_FILTERED_AUTO =
        COMPLETE_INST_MODULE_SUMM_LIST.filter((o: ContactFlow) =>
            o.Name.endsWith(`_AUTO`),
        );
    logger.info(
        `Managers.getFlowModulesProvisionedByAutomation: COMPLETE_INST_SUMM_LIST_FILTERED_AUTO (Flows provisioned via automation)`,
        { log_detail: COMPLETE_INST_SUMM_LIST_FILTERED_AUTO.map((o: ContactFlow) => {
            return o.Name;
        })}
    );
    return COMPLETE_INST_SUMM_LIST_FILTERED_AUTO
}

export async function getFlowsToUpdate(
    COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
    CAPABILITY_ID: string,
    S3_FLOWS: ContactFlowSummary[],
    S3_FLOWS_FILTERED_BY_CAP_ID: ContactFlowSummary[]
) {
    const COMPLETE_INST_SUMM_LIST_FILTERED_AUTO_CAPID =
        COMPLETE_INST_SUMM_LIST.filter((o: ContactFlow) =>
            o.Name.endsWith(`_AUTO`) && o.Name.startsWith(`${CAPABILITY_ID}_`),
        );
    logger.info(
        `Managers.getFlowsToUpdate: COMPLETE_INST_SUMM_LIST_FILTERED_AUTO_CAPID (Flows provisioned via automation and filtered CAPID)`,
        { log_detail: COMPLETE_INST_SUMM_LIST_FILTERED_AUTO_CAPID.map((o: ContactFlow) => {
            return o.Name;
        })}
    );

    const INST_SUMM_LIST_FILTERED_AUTO_CAPID_WO_ORPHANS =
        COMPLETE_INST_SUMM_LIST_FILTERED_AUTO_CAPID.filter((o: ContactFlow) =>
            S3_FLOWS.some((i) => i.Name === o.Name),
        );
    logger.info(
        `Managers.getFlowsToUpdate: Array of flows provisioned through automation without orphaned flows:`,
        { log_detail: INST_SUMM_LIST_FILTERED_AUTO_CAPID_WO_ORPHANS.map((o: ContactFlow) => {
            return o.Name;
        })},
    );

    const FLOWS_TO_UPDATE = mergeContactFlowArrays(
        INST_SUMM_LIST_FILTERED_AUTO_CAPID_WO_ORPHANS,
        S3_FLOWS_FILTERED_BY_CAP_ID,
    );
    logger.info("Managers.getFlowsToUpdate: FLOWS_TO_UPDATE: ", { log_detail: FLOWS_TO_UPDATE.map((o: ContactFlow) => {
        return o.Name;
    })});

    return FLOWS_TO_UPDATE
}

export async function getFlowModulesToUpdate(
    COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
    CAPABILITY_ID: string,
    S3_FLOW_MODULES: ContactFlowModuleSummary[],
    S3_FLOW_MODULES_FILTERED_BY_CAP_ID: ContactFlowModuleSummary[]
) {
    const COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_AUTO_CAPID =
        COMPLETE_INST_MODULE_SUMM_LIST.filter((o: ContactFlow) =>
            o.Name.endsWith(`_AUTO`) && o.Name.startsWith(`${CAPABILITY_ID}_`),
        );
    logger.info(
        `Managers.getFlowModulesToUpdate: COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_AUTO_CAPID (Flows provisioned via automation and filtered CAPID)`,
        { log_detail: COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_AUTO_CAPID.map((o: ContactFlow) => {
            return o.Name;
        })}
    );

    const INST_SUMM_LIST_FILTERED_AUTO_CAPID_WO_ORPHANS =
        COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_AUTO_CAPID.filter((o: ContactFlow) =>
        S3_FLOW_MODULES.some((i) => i.Name === o.Name),
        );
    logger.info(
        `Managers.getFlowModulesToUpdate: Array of flow Modules provisioned through automation without orphaned flows:`,
        { log_detail: INST_SUMM_LIST_FILTERED_AUTO_CAPID_WO_ORPHANS.map((o: ContactFlow) => {
            return o.Name;
        })});

    const FLOW_MODULES_TO_UPDATE = mergeContactFlowArrays(
        INST_SUMM_LIST_FILTERED_AUTO_CAPID_WO_ORPHANS,
        S3_FLOW_MODULES_FILTERED_BY_CAP_ID,
    );
    logger.info("Managers.getFlowModulesToUpdate: FLOW_MODULES_TO_UPDATE: ", { log_detail: FLOW_MODULES_TO_UPDATE.map((o: ContactFlow) => {
        return o.Name;
    })});

    return FLOW_MODULES_TO_UPDATE
}

export async function buildConnectObject(
    INSTANCE_ID: string, 
    NAMING_PREFIX: string,
    CAPABILITY_ID: string,
    IVR_ID: string,
    COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
    COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
    S3_FLOWS: ContactFlowSummary[],
    S3_FLOW_MODULES: ContactFlowModuleSummary[],
    INST_SUMM_LIST_DEFAULT_FLOWS: ContactFlowSummary[],
    CAPABILITY_INCLUDES?: Map<any, any>
) {
    const COMPLETE_INST_SUMM_LIST_FILTERED_AUTO = await getFlowsProvisionedByAutomation(COMPLETE_INST_SUMM_LIST)
    const INST_SUMM_LIST_FILTERED_AUTO_WO_ORPHANS =
        COMPLETE_INST_SUMM_LIST_FILTERED_AUTO.filter((o: ContactFlow) =>
            S3_FLOWS.some((i) => i.Name === o.Name),
        );
    logger.info(
        `Managers.buildConnectObject: Array of flows provisioned through automation by _AUTO not containing orphaned flows:`,
        { log_detail: INST_SUMM_LIST_FILTERED_AUTO_WO_ORPHANS},
    );

    const COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_AUTO = await getFlowModulesProvisionedByAutomation(COMPLETE_INST_MODULE_SUMM_LIST)
    const INST_MODULE_SUMM_LIST_FILTERED_IVR_ID_WO_ORPHANS =
        COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_AUTO.filter(
            (o: ContactFlowModule) => S3_FLOW_MODULES.some((i) => i.Name === o.Name),
        );
    logger.info(
        `Managers.buildConnectObject: Array of flow modules provisioned through automation by _AUTO not containing orphaned flows:`,
        { log_detail: INST_MODULE_SUMM_LIST_FILTERED_IVR_ID_WO_ORPHANS},
    );

    const connectObjMap = new Map();

    // * Get Connect inventory of queues, prompts, lexbots and lambda functions

    const connectMgrMap = await connectGetInventory(INSTANCE_ID, NAMING_PREFIX, CAPABILITY_ID, IVR_ID);
    for (let entry of connectMgrMap.entries()) {
        connectObjMap.set(entry[0], entry[1]);
    }
    // Add capability includes

    if (CAPABILITY_INCLUDES != undefined) {
        for (let entry of CAPABILITY_INCLUDES.entries()) {
            connectObjMap.set(entry[0], entry[1]);
        }
    }
    

    // * Add flows and display the mapped Connect object
    for (const flow of INST_SUMM_LIST_FILTERED_AUTO_WO_ORPHANS) {
        connectObjMap.set(flow.Name, flow.Arn);
    }
    for (const flow of INST_MODULE_SUMM_LIST_FILTERED_IVR_ID_WO_ORPHANS) {
        connectObjMap.set(flow.Name, flow.Arn);
    }
    for (const flow of INST_SUMM_LIST_DEFAULT_FLOWS) {
        connectObjMap.set(flow.Name, flow.Arn);
    }
    return connectObjMap
}

export async function buildTotalConnectObject(
    INSTANCE_ID: string, 
    NAMING_PREFIX: string,
    CAPABILITY_ID: string,
    IVR_ID: string,
    COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
    COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
    S3_FLOWS: ContactFlowSummary[],
    S3_FLOW_MODULES: ContactFlowModuleSummary[],
    INST_SUMM_LIST_DEFAULT_FLOWS: ContactFlowSummary[]

) {
    const connectObjMap = new Map();

    // * Get Connect inventory of queues, prompts, lexbots and lambda functions

    const connectMgrMap = await connectGetFullInventory(INSTANCE_ID, NAMING_PREFIX, CAPABILITY_ID, IVR_ID);
    for (let entry of connectMgrMap.entries()) {
        connectObjMap.set(entry[0], entry[1]);
    }

    // * Add flows and display the mapped Total Connect object
    for (const flow of COMPLETE_INST_SUMM_LIST) {
        connectObjMap.set(flow.Name, flow.Arn);
    }
    for (const flow of COMPLETE_INST_MODULE_SUMM_LIST) {
        connectObjMap.set(flow.Name, flow.Arn);
    }
    return connectObjMap
}

export async function handleContactFlowReplacements(
    FLOWS_TO_UPDATE: ContactFlow[],
    INSTANCE_ID: string,
    connectObject: any,
    connectObjMapTotal: Map<any, any>,
    phoneMapConfig?: string
){
    const newFlowObject = await reMapObjectToFlowAtt(connectObject)
    try {
        for (let uflow of FLOWS_TO_UPDATE) {
            const flowName = uflow.Name;
            const flowId = uflow.Id;
            logger.info(`handleContactFlowReplacements: Starting ${flowName}`)
        
            const engine = new ReplacementEngine();
            engine.setNext(new FunctionObjectMapsReplacer())
                    .setNext(new PromptReplacer())
                    .setNext(new QueueReplacer())
                    .setNext(new FunctionReplacer())
                    .setNext(new FlowReplacer());
        
            const replaceResult = engine.replace(uflow.Content, newFlowObject, connectObjMapTotal);
            logger.debug("ReplacementEngine result", replaceResult )
            // * This block validates that referenced flow var values are in flow vars of flow
            validateFlowVars(uflow, connectObject); 
            // * This block updates the flows
            const updateCFResponse = await updateContactFlow(
                flowId,
                INSTANCE_ID,
                replaceResult,
            );
            logger.info(`handleContactFlowReplacements:Default: Updated ${flowName}`, {log_detail: updateCFResponse});
            let updateMetadataCommand =
                new UpdateContactFlowMetadataCommand({
                    ContactFlowId: flowId,
                    Description: uflow.Description,
                    InstanceId: INSTANCE_ID,
                });
            try {
                await getConnectClient(region).send(updateMetadataCommand);
            } catch (error) {logger.info(`handleContactFlowReplacements:error updating metadata (description doesn't exist) for ${flowName}`), {error: error}}
            
        }
    } catch (error) {
        logger.error("Managers.handleContactFlowReplacements: Error updating contact flows", error as Error);
        throw error;
    }
}

export async function handleContactFlowModuleReplacements(
    FLOW_MODULES_TO_UPDATE: ContactFlowModule[],
    INSTANCE_ID: string,
    connectObject: any,
    connectObjMapTotal: Map<any, any>
){ 
    const newFlowObject = await reMapObjectToFlowAtt(connectObject)
    try {
        for (let uflow of FLOW_MODULES_TO_UPDATE) {
            logger.info(`Managers.handleContactFlowModuleReplacements: Starting ${uflow.Name}`)
            const engine = new ReplacementEngine();
            engine.setNext(new FunctionObjectMapsReplacer())
                    .setNext(new PromptReplacer())
                    .setNext(new QueueReplacer())
                    .setNext(new FunctionReplacer())
                    .setNext(new FlowReplacer());
        
            const replaceResult = engine.replace(uflow.Content, newFlowObject, connectObjMapTotal);
            logger.debug("ReplacementEngine result", replaceResult )
            // * This block validates that referenced flow var values are in flow vars of flow
            validateFlowVars(uflow, connectObject); 
            // * This block updates the flow modules
            const updateCFResponse = await updateContactFlowModule(
                uflow.Id,
                INSTANCE_ID,
                replaceResult,
            );
            logger.info(
                `Managers.handleContactFlowModuleReplacements: Updated ${uflow.Name}`, { log_detail: updateCFResponse}
            );
        }
    } catch (error) {
        logger.error("Error updating contact flow modules", error as Error);
        throw error;
    }
}

// export async function updateMappingObject(
//     MAPPING_FN_NAME: string,
//     connectObject: any,
// ){
//     const mapperFile = [];
//     mapperFile.push(`exports.handler =  async (_event) => {`);
//     mapperFile.push(`return`);
//     mapperFile.push(JSON.stringify(connectObject));
//     mapperFile.push(`}`);
//     createFile(mapperFile);

//     //* Zip Mapping Function index.js file and upload to S3.

//     const readFile = fs.readFileSync("/tmp/mappingFile.js", "utf8");
//     const beautifiedCode = js_beautify(readFile, {
//         indent_size: 2,
//         space_in_empty_paren: true,
//     });
//     logger.info("Managers.updateMappingObject: beautified: ");
//     console.log(beautifiedCode)
//     const zip = new JSZip();
//     try {
//         zip.file("index.js", beautifiedCode);
//         zip.generateNodeStream({ type: "nodebuffer", streamFiles: true })
//             .pipe(fs.createWriteStream("/tmp/index.zip"))
//             .on("finish", function () {
//                 console.log("zip created");
//             });
//     } catch (error) {
//         logger.error("Managers.updateMappingObject: Error zipping function", error as Error);
//         throw error;
//     }

//     const fileStream = fs.createReadStream(`/tmp/index.zip`);

//     try {
//         const data = new Upload({
//             client: getS3Client(region),
//             params: {
//                 Bucket: bucketName,
//                 Key: "index.zip",
//                 Body: fileStream,
//             },
//         });

//         data.on("httpUploadProgress", (progress: any) => {
//             console.log(progress);
//         });

//         await data.done();
//     } catch (e) {
//         console.log(e);
//     }

//     logger.info(`Managers.updateMappingObject: Function to be updated: ${MAPPING_FN_NAME}`);

//     try {
//         const lambdaCommand = new UpdateFunctionCodeCommand({
//             FunctionName: MAPPING_FN_NAME,
//             Publish: false,
//             S3Bucket: bucketName,
//             S3Key: "index.zip",
//         });

//         // eslint-disable-line @typescript-eslint/no-unused-vars
//         const lambdaResponse: any = await getLambdaClient(region).send(lambdaCommand);
//         logger.info(`Managers.updateMappingObject: UpdateFunction response`, {log_detail: lambdaResponse});
//     } catch (error) {
//         logger.error("Error updating Function", error as Error);
//         throw error;
//     }
// }

// export async function getCapabilityIncludes(INSTANCE_ID: string, connectObjMapTotal: Map<any, any>, capabilityIncludes: string) {
//     // This function is creating a map of all included objects per environment from the capability includes file. 
//     // With lambdas it is creating a kv pair with the lambdaBaseName and the arn of the full function name in that env.
//     // This allows the lambdaBaseName to stay consistent across environments, ivr's
//     let includes = JSON.parse(capabilityIncludes);
//     const includesMap = new Map();
//     let functionIncludes = Object.keys(includes.functions)
//     for (let functionBaseName in functionIncludes) {
//         let fxn = Object.keys(includes.functions[`${functionIncludes[functionBaseName]}`][`${region}`][`${env}`])
//         for (let f in fxn) {
//             let v = connectObjMapTotal.get(fxn[f])
//             if (v == undefined) {
//                 logger.error(`managers.getCapabilityIncludes: ${fxn[f]} does not a exist on instance. Check capability includes file`)
//                 continue
//             }
//             // includesMap.set(fxn[f], v)
//             includesMap.set(functionIncludes[functionBaseName], v)
//             logger.info("managers.getCapabilityIncludes: ", {f: fxn[f], v: v, functionBaseName: functionIncludes[functionBaseName]})
//         }   
//     }
//     let obj = Object.values(includes.connect_objects)
//     logger.debug("managers.getCapabilityIncludes: ", {obj: obj})
//     for (let o in obj) {
//         let v = connectObjMapTotal.get(obj[o])
//         logger.debug("managers.getCapabilityIncludes: ", { o: obj[o], v: v})
//         includesMap.set(obj[o], v)
//     }
//     logger.info("managers.getCapabilityIncludes: ", {newObject: Object.fromEntries(includesMap)})

//     return includesMap
// }

