// import { ContactFlow, ContactFlowModule } from "@aws-sdk/client-connect";
import { Logger } from "@aws-lambda-powertools/logger";
import { getParameter } from "@aws-lambda-powertools/parameters/ssm";
import { Helpers } from "./helpers";
import { ContactFlowBuilder } from "./replacements";

const {
    AWS_REGION: region,
    ENVIRONMENT: env,
    TF_VAR_capability_id: capability_id,
    TF_VAR_ivr_id: ivr_id,
    ACCOUNT: accountId,
} = process.env;
const logger = new Logger({ serviceName: "replacer" });
const regionShortNames = new Map([
    ["us-east-1", "use1"],
    ["us-west-2", "usw2"],
]);
const SSM_PREFIX = `/${env}/${regionShortNames.get(region)}/${ivr_id}`;

if (!region) throw new Error("AWS_REGION is required");
if (!env) throw new Error("ENVIRONMENT is required");
if (!capability_id) throw new Error("TF_VAR_capability_id is required");
if (!ivr_id) throw new Error("TF_VAR_ivr_id is required");
if (!accountId) throw new Error("ACCOUNT is required");

async function provisioner(
    CAPABILITY_ID: string,
    IVR_ID: string,
    FLOW_PATH: string,
): Promise<Map<string, string>> {
    // eslint-disable-line @typescript-eslint/no-unused-vars

    //* Setup

    // const SSM_PREFIX = `/${env}/${regionShortNames.get(region)}/${IVR_ID}`;

    //* Get Instance ID from SSM
    const INSTANCE_ID = await getParameter(
        `${SSM_PREFIX}/amz-connect-instance-id`,
    );
    // * Instantiate Helpers Class
    const helpers = new Helpers(INSTANCE_ID, CAPABILITY_ID, IVR_ID);
    //*  Instantiate
    const replacer = new ContactFlowBuilder(region, env, IVR_ID);
    const files = replacer.getContactFlows(FLOW_PATH);
    const FLOWS_TO_UPDATE = [],
        FLOWMODULES_TO_UPDATE = [];
    files.map((flow) => {
        if (flow.Type) {
            FLOWS_TO_UPDATE.push(flow);
            return;
        } else {
            FLOWMODULES_TO_UPDATE.push(flow);
            return;
        }
    });
    logger.info("flows to update", {
        detail: FLOWS_TO_UPDATE.map((flow) => flow.Name),
    });
    logger.info("flow modules to update", {
        detail: FLOWMODULES_TO_UPDATE.map((module) => module.Name),
    });

    //* Get contact flows and flow modules that exist on Connect Instance
    const CONTACT_FLOWS_TO_ADD =
        await helpers.getContactFlowsToAdd(FLOWS_TO_UPDATE);
    const CONTACT_FLOW_MODULES_TO_ADD =
        await helpers.getContactFlowModulesToAdd(FLOWMODULES_TO_UPDATE);

    // * Provision contact flows and flow module slugs on instance. This is done
    // * so that we can take a full inventory with new flows and flow modules provisioned.
    await helpers.createContactFlowSlugs(CONTACT_FLOWS_TO_ADD);
    await helpers.createContactFlowModuleSlugs(CONTACT_FLOW_MODULES_TO_ADD);

    //* Retrieve complete list of contact flows and flow modules after slugs provisioned

    const COMPLETE_INST_SUMM_LIST = await helpers.listContactFlows();
    const COMPLETE_INST_MODULE_SUMM_LIST =
        await helpers.listContactFlowModules();

    // * Rename and Archive Orphaned Flows
    await helpers.handleOrphanedFlows(COMPLETE_INST_SUMM_LIST, FLOWS_TO_UPDATE);
    await helpers.handleOrphanedFlowModules(
        COMPLETE_INST_MODULE_SUMM_LIST,
        FLOWMODULES_TO_UPDATE,
    );

    //* Get Full list of Queues, Prompts , and Lexbots on instance

    const instanceQueues = await helpers.listQueues();
    const instancePrompts = await helpers.listPrompts();
    const instanceBots = await helpers.listBots();

    //* Assemble full connect inventory as a map to be used when handling external capability_includes objects
    const COMPLETE_INV = await helpers.getCompleteInventory(
        COMPLETE_INST_SUMM_LIST,
        COMPLETE_INST_MODULE_SUMM_LIST,
        instanceQueues,
        instancePrompts,
        instanceBots,
    );

    logger.info("Provisioning Complete"); //, {
    //     COMPLETE_INV: Object.fromEntries(COMPLETE_INV),
    //   });
    // console.log(COMPLETE_INV);

    return COMPLETE_INV;
}

async function replaceManager(flow_path: string, outDir: string) {
    //* Get Instance ID from SSM
    const INSTANCE_ID = await getParameter(
        `${SSM_PREFIX}/amz-connect-instance-id`,
    );
    const replacer = new ContactFlowBuilder(region, env, ivr_id); //
    const inventoryMap = await provisioner(capability_id, ivr_id, flow_path);
    console.log(inventoryMap);

    // Retrieve the contact flows from the local directory that need replacements
    const FLOWS_TO_UPDATE = replacer.getContactFlows(flow_path);
    logger.info(`FLOWS_TO_UPDATE: `, {
        FLOWS_TO_UPDATE: FLOWS_TO_UPDATE.map((flow) => flow.Name),
    });

    await replacer.handleReplacements(
        FLOWS_TO_UPDATE,
        accountId,
        region,
        INSTANCE_ID,
        env,
        inventoryMap,
        outDir,
    );
}

replaceManager(
    "../../../imports/resources/flows",
    "../../imports/contact_flow_content",
);
