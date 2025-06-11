import {
    ContactFlow,
    ContactFlowType,
    ContactFlowModuleSummary,
    ContactFlowSummary,
    CreateContactFlowCommand,
    CreateContactFlowModuleCommand,
    CreateContactFlowCommandOutput,
    CreateContactFlowModuleCommandOutput,
    ListContactFlowsCommand,
    ListContactFlowModulesCommand,
    ListPromptsCommand,
    ListQueuesCommand,
    PromptSummary,
    QueueSummary,
    UpdateContactFlowModuleMetadataCommand,
    UpdateContactFlowMetadataCommand,
    ConnectClient
  } from "@aws-sdk/client-connect";
  import { getConnectClient } from "./aws";
  import { Logger } from "@aws-lambda-powertools/logger";
  
  const logger = new Logger({ serviceName: "provisioner" });
  const region = process.env.AWS_REGION;
  
  /**
   * Class for managing Amazon Connect resources
   */
  export class ConnectManager {
    private client: ConnectClient;
  
    constructor() {
      this.client = getConnectClient(region);
    }
  
    /**
     * Creates a new contact flow
     * @param {string} Name - The name of the contact flow
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @param {ContactFlowType} Type - The type of the contact flow
     * @param {string} Content - The content of the contact flow
     * @param {Record<string, string>} Tags - The tags to be applied to the contact flow
     * @param {string} [Description] - The description of the contact flow
     * @returns {Promise<CreateContactFlowCommandOutput>} The response from the CreateContactFlowCommand
     */
    public async createContactFlow(
      Name: string,
      INSTANCE_ID: string,
      Type: ContactFlowType,
      Content: string,
      Tags: Record<string, string>,
      Description?: string
    ): Promise<CreateContactFlowCommandOutput> {
      const createCommand = new CreateContactFlowCommand({
        Name: Name,
        InstanceId: INSTANCE_ID,
        Type: Type,
        Content: Content,
        Tags: Tags,
        Description: Description,
      });
      logger.info(`Adding ${Name}`);
      const resp = await this.client.send(createCommand);
      logger.info(`response ${JSON.stringify(resp, null, 2)}`);
      return resp;
    }
  
    /**
     * Creates a new contact flow module
     * @param {string} Name - The name of the contact flow module
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @param {string} Content - The content of the contact flow module
     * @param {Record<string, string>} Tags - The tags to be applied to the contact flow module
     * @param {string} [Description] - The description of the contact flow module
     * @returns {Promise<CreateContactFlowModuleCommandOutput>} The response from the CreateContactFlowModuleCommand
     */
    public async createContactFlowModule(
      Name: string,
      INSTANCE_ID: string,
      Content: string,
      Tags: Record<string, string>,
      Description?: string
    ): Promise<CreateContactFlowModuleCommandOutput> {
      const createCommand = new CreateContactFlowModuleCommand({
        Name: Name,
        InstanceId: INSTANCE_ID,
        Content: Content,
        Tags: Tags,
        Description: Description,
      });
      logger.info(`Adding ${Name}`);
      const resp = await this.client.send(createCommand);
      logger.info(`response ${JSON.stringify(resp, null, 2)}`);
      return resp;
    }
  
    /**
     * Lists all contact flows in the specified Amazon Connect instance
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @returns {Promise<ContactFlowSummary[]>} An array of contact flow summaries
     */
    public async listContactFlows(INSTANCE_ID: string): Promise<ContactFlowSummary[]> {
      let nextToken: string | undefined;
      const flows: ContactFlowSummary[] = [];
  
      do {
        const resp = await this.client.send(
          new ListContactFlowsCommand({
            InstanceId: INSTANCE_ID,
            NextToken: nextToken,
            MaxResults: 1000,
          })
        );
  
        const data = resp?.ContactFlowSummaryList || [];
        if (data.length < 1) break;
        nextToken = resp?.NextToken;
        flows.push(...data);
      } while (nextToken);
  
      logger.info(`ConnectManager.listContactFlows: Found ${flows.length} contact flows`);
      return flows;
    }
  
    /**
     * Lists all contact flow modules in the specified Amazon Connect instance
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @returns {Promise<ContactFlowModuleSummary[]>} An array of contact flow module summaries
     */
    public async listContactFlowModules(INSTANCE_ID: string): Promise<ContactFlowModuleSummary[]> {
      let nextToken: string | undefined;
      const flows: ContactFlowModuleSummary[] = [];
  
      do {
        const resp = await this.client.send(
          new ListContactFlowModulesCommand({
            InstanceId: INSTANCE_ID,
            NextToken: nextToken,
            MaxResults: 1000,
            ContactFlowModuleState: "ACTIVE",
          })
        );
  
        const data = resp?.ContactFlowModulesSummaryList || [];
        if (data.length < 1) break;
        nextToken = resp?.NextToken;
        flows.push(...data);
      } while (nextToken);
  
      logger.info(`ConnectManager.listContactFlowModules: Found ${flows.length} contact flow modules`);
      return flows;
    }
  
    /**
     * Lists all queues in the specified Amazon Connect instance
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @returns {Promise<Map<string, string>>} A map of queue names and ARNs
     */
    public async listQueues(INSTANCE_ID: string): Promise<Map<string, string>> {
      const localMap = new Map();
      let nextToken: string | undefined;
      const queues: QueueSummary[] = [];
      try {
        do {
          const lqList = new ListQueuesCommand({
            InstanceId: INSTANCE_ID,
            NextToken: nextToken,
            MaxResults: 1000,
          });
          const resp = await this.client.send(lqList);
          const data = resp?.QueueSummaryList || [];
          if (data.length < 1) break;
          nextToken = resp?.NextToken;
          queues.push(...data);
        } while (nextToken);
        logger.info(`ConnectManager.listQueues: Found ${queues.length - 1}`);
        for (const p of queues) {
          if (p.Name) {
            localMap.set(p.Name, p.Arn);
          }
        }
      } catch (error) {
        logger.error("ConnectManager.listQueues error: ", error as Error);
        throw error;
      }
      logger.info("ConnectManager.listQueues: ", {
        log_detail: Object.fromEntries(localMap),
      });
      return localMap;
    }
  
    /**
     * Lists all prompts in the specified Amazon Connect instance
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @returns {Promise<Map<string, string>>} A map of prompt names and ARNs
     */
    public async listPrompts(INSTANCE_ID: string): Promise<Map<string, string>> {
      const localMap = new Map();
      let nextToken: string | undefined;
      const prompts: PromptSummary[] = [];
      try {
        do {
          const pList = new ListPromptsCommand({
            InstanceId: INSTANCE_ID,
            NextToken: nextToken,
            MaxResults: 1000,
          });
          const resp = await this.client.send(pList);
          const data = resp?.PromptSummaryList || [];
          if (data.length < 1) break;
          nextToken = resp?.NextToken;
          prompts.push(...data);
        } while (nextToken);
        logger.info(`ConnectManager.listPrompts: Found ${prompts.length - 1}`);
        for (const p of prompts) {
          const stripName = p.Name.split(".");
          localMap.set(stripName[0], p.Arn);
        }
      } catch (error) {
        logger.error("ConnectManager.listPrompts error", error as Error);
        throw error;
      }
      return localMap;
    }
  
    /**
     * Updates the metadata of a contact flow
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @param {ContactFlow} FLOW - The contact flow to be updated
     * @returns {Promise<void>}
     */
    public async UpdateContactFlowMetadata(INSTANCE_ID: string, FLOW: ContactFlow): Promise<void> {
      const updateMetadataCommand = new UpdateContactFlowMetadataCommand({
        ContactFlowId: FLOW.Id,
        Name: `z_${FLOW.Name}`,
        Description: "Orphaned Flow",
        ContactFlowState: "ARCHIVED",
        InstanceId: INSTANCE_ID,
      });
      logger.info(`ConnectManager.UpdateContactFlowMetadata: Updating ${FLOW.Name}`);
      await this.client.send(updateMetadataCommand);
      logger.info(`ConnectManager.UpdateContactFlowMetadata: ${FLOW.Name} renamed and archived`);
    }
  
    /**
     * Updates the metadata of a contact flow module
     * @param {string} INSTANCE_ID - The ID of the Amazon Connect instance
     * @param {ContactFlow} FLOW - The contact flow module to be updated
     * @returns {Promise<void>}
     */
    public async UpdateContactFlowModuleMetadata(INSTANCE_ID: string, FLOW: ContactFlow): Promise<void> {
      const updateMetadataCommand = new UpdateContactFlowModuleMetadataCommand({
        ContactFlowModuleId: FLOW.Id,
        Name: `z_${FLOW.Name}`,
        Description: "Orphaned Flow Module",
        State: "ARCHIVED",
        InstanceId: INSTANCE_ID,
      });
      logger.info(`ConnectManager.UpdateContactFlowModuleMetadata: Updating ${FLOW.Name}`);
      await this.client.send(updateMetadataCommand);
      logger.info(`ConnectManager.UpdateContactFlowModuleMetadata: ${FLOW.Name} renamed and archived`);
    }
  }