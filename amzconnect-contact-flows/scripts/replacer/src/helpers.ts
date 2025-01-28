import {
    ContactFlow,
    ContactFlowModule,
    ContactFlowSummary,
    ContactFlowModuleSummary,
    FlowAssociationResourceType,
} from "@aws-sdk/client-connect";
import { BotSummary } from "@aws-sdk/client-lex-models-v2";
import { Logger } from "@aws-lambda-powertools/logger";
import { ConnectManager } from "./utils/connect";
import { Utils } from "./utils/misc";
import { LexBotManager } from "./utils/lex";
import { LambdaManager } from "./utils/lambda";
import { S3Manager } from "./utils/s3";
import fs from "fs";
import { QiCManager } from "./utils/qic";

/**
 * Manages the provisioning of resources for Connect instances.
 */
export class Helpers {
    private region: string;
    private env: string;
    private bucket: string;
    private logger: Logger;
    private instanceId: string;
    private capabilityId: string;
    private ivrId: string;
    private connectManager: ConnectManager;
    private lambdaManager: LambdaManager;
    private lexbotManager: LexBotManager;
    private s3Manager: S3Manager;
    private QiCManager: QiCManager;
    //   private cIInit: CIInit;

    /**
     * Constructs a new instance of the Helpers class.
     * @param instanceId - The ID of the Connect instance.
     * @param capabilityId - The ID of the capability.
     * @param ivrId - The ID of the IVR.
     */
    constructor(instanceId: string, capabilityId: string, ivrId: string) {
        this.region = process.env.AWS_REGION;
        this.env = process.env.FUNCTION_ENV;
        this.bucket = process.env.BUCKET;
        this.logger = new Logger({ serviceName: "provisioner" });
        this.instanceId = instanceId;
        this.capabilityId = capabilityId;
        this.ivrId = ivrId;
        this.connectManager = new ConnectManager();
        this.lambdaManager = new LambdaManager();
        this.lexbotManager = new LexBotManager();
        this.s3Manager = new S3Manager();
        this.QiCManager = new QiCManager();
    }

    /**
     * Retrieves the contact flows that need to be added to the Connect instance.
     * @param S3_FLOWS - An array of contact flows from S3.
     * @returns An array of contact flows to be added.
     */
    async getContactFlowsToAdd(
        S3_FLOWS: ContactFlow[],
    ): Promise<ContactFlow[]> {
        const INST_CONTACT_FLOWS = await this.connectManager.listContactFlows(
            this.instanceId,
        );
        this.logger.info(
            "Helpers.getContactFlowsToAdd: INST_CONTACT_FLOWS (currently on Instance)",
            {
                log_detail: INST_CONTACT_FLOWS.map((o) => o.Name),
            },
        );

        const _cf = S3_FLOWS.filter(
            (o) =>
                !INST_CONTACT_FLOWS.some((i: ContactFlow) => i.Name === o.Name),
        );

        this.logger.info(
            `Helpers.getContactFlowsToAdd: Flows within capability not present on Connect instance (i.e. New): `,
            {
                log_detail: _cf.map((o) => o.Name),
            },
        );
        return _cf;
    }

    /**
     * Retrieves the contact flow modules that need to be added to the Connect instance.
     * @param S3_FLOW_MODULES - An array of contact flow modules from S3.
     * @returns An array of contact flow modules to be added.
     */
    async getContactFlowModulesToAdd(
        S3_FLOW_MODULES: ContactFlowModule[],
    ): Promise<ContactFlowModule[]> {
        const INST_CONTACT_FLOW_MODULES =
            await this.connectManager.listContactFlowModules(this.instanceId);
        this.logger.info(
            "Helpers.getContactFlowModulesToAdd: INST_CONTACT_FLOW_MODULES (currently on Instance)",
            {
                log_detail: INST_CONTACT_FLOW_MODULES.map((o) => o.Name),
            },
        );

        const _cfm = S3_FLOW_MODULES.filter(
            (o) =>
                !INST_CONTACT_FLOW_MODULES.some(
                    (i: ContactFlowModule) => i.Name === o.Name,
                ),
        );
        console.log(
            `Helpers.getContactFlowModulesToAdd: Flow Modules within capability not present on Connect instance (i.e. New): `,
            _cfm.map((o) => o.Name),
        );
        return _cfm;
    }

    /**
     * Creates contact flow slugs on the Connect instance.
     * @param CONTACT_FLOWS_TO_ADD - An array of contact flows to be added.
     */
    async createContactFlowSlugs(
        // END_FLOW_EXEC_WQ_JSON: string,
        // DISCONNECT_PARTICIPANT_JSON: string,
        // MSG_PARTICIPANT_ITER_HOLDS_JSON: string,
        CONTACT_FLOWS_TO_ADD: ContactFlow[],
    ): Promise<void> {
        const DISCONNECT_PARTICIPANT_JSON = fs.readFileSync(
            `../../templates/disconnectParticipant.json`,
            "utf8",
        );
        const END_FLOW_EXEC_WQ_JSON = fs.readFileSync(
            `../../templates/endFlowExecution_whisper.json`,
            "utf8",
        );
        const MSG_PARTICIPANT_ITER_HOLDS_JSON = fs.readFileSync(
            `../../templates/messageParticipantIteratively_holds.json`,
            "utf8",
        );
        for (const flow of CONTACT_FLOWS_TO_ADD) {
            this.logger.info(`Helpers.createContactFlows: Adding ${flow.Name}`);
            if (flow.Type.includes("_WHISPER")) {
                await this.connectManager.createContactFlow(
                    flow.Name,
                    this.instanceId,
                    flow.Type,
                    END_FLOW_EXEC_WQ_JSON,
                    { pipeline_provisioned: this.ivrId, ...flow.Tags },
                    flow.Description || "Deployed via Automation",
                );
            } else if (flow.Type.includes("_HOLD")) {
                await this.connectManager.createContactFlow(
                    flow.Name,
                    this.instanceId,
                    flow.Type,
                    MSG_PARTICIPANT_ITER_HOLDS_JSON,
                    { pipeline_provisioned: this.ivrId, ...flow.Tags },
                    flow.Description || "Deployed via Automation",
                );
            } else {
                await this.connectManager.createContactFlow(
                    flow.Name,
                    this.instanceId,
                    flow.Type,
                    DISCONNECT_PARTICIPANT_JSON,
                    { pipeline_provisioned: this.ivrId, ...flow.Tags },
                    flow.Description || "Deployed via Automation",
                );
            }
        }
    }

    /**
     * Creates contact flow module slugs on the Connect instance.
     * @param CONTACT_FLOW_MODULES_TO_ADD - An array of contact flow modules to be added.
     */
    async createContactFlowModuleSlugs(
        // END_FLOW_MOD_EXECUTION_JSON: string,
        CONTACT_FLOW_MODULES_TO_ADD: ContactFlowModule[],
    ): Promise<void> {
        const END_FLOW_MOD_EXECUTION_JSON = fs.readFileSync(
            `../../templates/endFlowModuleExecution.json`,
            "utf8",
        );
        for (const flow of CONTACT_FLOW_MODULES_TO_ADD) {
            this.logger.info(
                `Helpers.createContactFlowModules: Adding ${flow.Name}`,
            );
            await this.connectManager.createContactFlowModule(
                flow.Name,
                this.instanceId,
                END_FLOW_MOD_EXECUTION_JSON,
                { pipeline_provisioned: this.ivrId, ...flow.Tags },
                flow.Description || "Deployed via Automation",
            );
        }
    }

    /**
     * Handles orphaned flows on the Connect instance.
     * @param COMPLETE_INST_SUMM_LIST - An array of contact flow summaries on the Connect instance.
     * @param S3_FLOWS - An array of contact flow summaries from S3.
     */
    async handleOrphanedFlows(
        COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
        S3_FLOWS: ContactFlowSummary[],
    ): Promise<void> {
        const COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID =
            COMPLETE_INST_SUMM_LIST.filter((o: ContactFlow) =>
                o.Name.startsWith(`${this.capabilityId}_`),
            );
        this.logger.debug(
            "Helpers.handleOrphanedFlows: COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID",
            { log_detail: COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID },
        );

        const ORPHANED_FLOWS =
            COMPLETE_INST_SUMM_LIST_FILTERED_CAPABILITY_ID.filter(
                (o: ContactFlow) => !S3_FLOWS.some((i) => i.Name === o.Name),
            );
        this.logger.info(
            `Helpers.handleOrphanedFlows: Array of Orphaned Flows on Connect instance within capability but not present in S3/Source Repository:`,
            { log_detail: ORPHANED_FLOWS.map((flow) => flow.Name) },
        );

        try {
            for (const uflow of ORPHANED_FLOWS) {
                await this.connectManager.UpdateContactFlowMetadata(
                    this.instanceId,
                    uflow,
                );
            }
        } catch (error) {
            this.logger.error("Error renaming flows", error as Error);
            throw error;
        }
    }

    /**
     * Handles orphaned flow modules on the Connect instance.
     * @param COMPLETE_INST_MODULE_SUMM_LIST - An array of contact flow module summaries on the Connect instance.
     * @param S3_FLOW_MODULES - An array of contact flow module summaries from S3.
     */
    async handleOrphanedFlowModules(
        COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
        S3_FLOW_MODULES: ContactFlowModuleSummary[],
    ): Promise<void> {
        const COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID =
            COMPLETE_INST_MODULE_SUMM_LIST.filter((o: ContactFlow) =>
                o.Name.startsWith(`${this.capabilityId}_`),
            );
        this.logger.info(
            "Helpers.handleOrphanedFlowModules: COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID",
            {
                log_detail:
                    COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID,
            },
        );

        const ORPHANED_MODULES =
            COMPLETE_INST_MODULE_SUMM_LIST_FILTERED_CAPABILITY_ID.filter(
                (o: ContactFlowModule) =>
                    !S3_FLOW_MODULES.some((i) => i.Name === o.Name),
            );
        this.logger.info(
            `Helpers.handleOrphanedFlowModules: Array of Orphaned Flow Modules on Connect instance within capability but not present in S3/Source Repository:`,
            { log_detail: ORPHANED_MODULES },
        );

        try {
            for (const uflow of ORPHANED_MODULES) {
                await this.connectManager.UpdateContactFlowModuleMetadata(
                    this.instanceId,
                    uflow,
                );
            }
        } catch (error) {
            this.logger.error("Error renaming flows", error as Error);
            throw error;
        }
    }

    /**
     * Builds the total Connect object for the instance.
     * @param COMPLETE_INST_SUMM_LIST - An array of contact flow summaries on the Connect instance.
     * @param COMPLETE_INST_MODULE_SUMM_LIST - An array of contact flow module summaries on the Connect instance.
     * @param INSTANCE_QUEUES - A map of instance queues.
     * @param INSTANCE_PROMPTS - A map of instance prompts.
     * @returns A map containing the total Connect object for the instance.
     */
    async getCompleteInventory(
        COMPLETE_INST_SUMM_LIST: ContactFlowSummary[],
        COMPLETE_INST_MODULE_SUMM_LIST: ContactFlowModuleSummary[],
        INSTANCE_QUEUES: Map<string, string>,
        INSTANCE_PROMPTS: Map<string, string>,
        INSTANCE_BOTS: BotSummary[],
    ): Promise<Map<string, string>> {
        const connectObjMap = new Map();

        for (const entry of INSTANCE_QUEUES.entries()) {
            connectObjMap.set(entry[0], entry[1]);
        }

        for (const entry of INSTANCE_PROMPTS.entries()) {
            connectObjMap.set(entry[0], entry[1]);
        }
        const localLambdaMap = await this.lambdaManager.listAllFunctions();
        for (const entry of localLambdaMap.entries()) {
            connectObjMap.set(entry[0], entry[1]);
        }

        for (const flow of COMPLETE_INST_SUMM_LIST) {
            connectObjMap.set(flow.Name, flow.Arn);
        }
        for (const flow of COMPLETE_INST_MODULE_SUMM_LIST) {
            connectObjMap.set(flow.Name, flow.Arn);
        }
        const qic = await this.QiCManager.listAssistants();
        for (const entry of qic) {
            connectObjMap.set(entry.name, entry.assistantId);
        }

        const arnMap = await this.lexbotManager.mapBotAliases(INSTANCE_BOTS);
        if (arnMap !== undefined) {
            for (const entry of arnMap.entries()) {
                connectObjMap.set(entry[0], entry[1]);
            }
        }

        this.logger.info("Helpers.getCompleteInventory: ", {
            newObject: Object.fromEntries(connectObjMap),
        });

        return connectObjMap;
    }

    /**
     * Lists all queues associated with the Connect instance.
     * @returns A map containing the queues and their ARNs.
     */
    async listQueues(): Promise<Map<string, string>> {
        return await this.connectManager.listQueues(this.instanceId);
    }

    /**
     * Lists all prompts associated with the Connect instance.
     * @returns A map containing the prompts and their ARNs.
     */
    async listPrompts(): Promise<Map<string, string>> {
        return await this.connectManager.listPrompts(this.instanceId);
    }

    /**
     * Lists all contact flows associated with the Connect instance.
     * @returns An array of contact flow summaries.
     */
    async listContactFlows(): Promise<ContactFlowSummary[]> {
        const resp = await this.connectManager.listContactFlows(
            this.instanceId,
        );
        this.logger.debug(
            "Flows provisioned on instance after creation of new flows from S3",
            {
                detail: resp
                    .map((o) => {
                        return o.Name;
                    })
                    .sort(),
            },
        );
        return resp;
    }

    /**
     * Lists all contact flow modules associated with the Connect instance.
     * @returns An array of contact flow module summaries.
     */
    async listContactFlowModules(): Promise<ContactFlowModuleSummary[]> {
        const resp = await this.connectManager.listContactFlowModules(
            this.instanceId,
        );
        this.logger.debug(
            "Flows provisioned on instance after creation of new flows from S3",
            {
                detail: resp
                    .map((o) => {
                        return o.Name;
                    })
                    .sort(),
            },
        );
        return resp;
    }

    /**
     * Lists all bots associated with the Connect instance.
     * @returns An array of bot summaries.
     */
    async listBots(): Promise<BotSummary[]> {
        return await this.lexbotManager.listBots();
    }

    /**
     * Downloads contact flows from S3.
     * @returns An array of contact flows retrieved from S3.
     */
    async downloadContactFlowsFromS3() {
        const S3_CONTENTS = await this.s3Manager.getS3Contents(
            this.bucket,
            this.ivrId,
            this.capabilityId,
        );
        this.logger.info(`S3Manager.getS3Contents.S3_CONTENTS:`, {
            log_detail: S3_CONTENTS.map((o) => {
                return o.Name;
            }),
        });
        return S3_CONTENTS;
    }

    /**
     * Retrieves the contact flow modules from the downloaded S3 contents.
     * @param S3_CONTENTS - An array of contact flows retrieved from S3.
     * @returns An array of contact flow modules.
     */
    async getS3Flows(S3_CONTENTS: ContactFlow[]): Promise<ContactFlow[]> {
        return await this.s3Manager.getS3Flows(S3_CONTENTS);
    }

    /**
     * Retrieves the contact flow modules from the downloaded S3 contents.
     * @param S3_CONTENTS - An array of contact flows retrieved from S3.
     * @returns An array of contact flow modules.
     */
    async getS3FlowModules(
        S3_CONTENTS: ContactFlow[],
    ): Promise<ContactFlowModule[]> {
        return await this.s3Manager.getS3FlowModules(S3_CONTENTS);
    }
}
