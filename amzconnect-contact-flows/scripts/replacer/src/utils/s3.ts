import {
    ListObjectsV2Command,
    GetObjectCommand,
    _Object,
  } from "@aws-sdk/client-s3";
  import { ContactFlow, ContactFlowModule } from "@aws-sdk/client-connect";
  import { Logger } from "@aws-lambda-powertools/logger";
  import { getS3Client } from "./aws";
  import { Readable } from "stream";
  
  const region = process.env.AWS_REGION;
  const logger = new Logger({ serviceName: "provisioner" });
  
  /**
   * Class for managing S3 operations
   */
  export class S3Manager {
    private client;
  
    constructor() {
      this.client = getS3Client(region);
    }
  
    /**
     * Reads a text file from S3
     * @param {string} bucket - The name of the S3 bucket
     * @param {string} key - The key (path) of the file in the S3 bucket
     * @returns {Promise<string>} The contents of the file as a string
     */
    public async readTextFile(bucket: string, key: string): Promise<string> {
      const asString = (stream: Readable) => {
        return new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.once("end", () => resolve(Buffer.concat(chunks)));
          stream.once("error", reject);
        });
      };
      logger.info(`S3.readTextFile: reading  ${key}`);
      const { Body } = await this.client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
  
      return (await asString(Body as Readable)).toString("utf-8");
    }
  
    /**
     * Lists objects in an S3 bucket with an optional prefix
     * @param {string} bucketName - The name of the S3 bucket
     * @param {string} [prefix] - An optional prefix to filter the objects
     * @returns {Promise<_Object[]>} An array of S3 objects
     */
    public async s3ListObjects(
      bucketName: string,
      prefix?: string
    ): Promise<_Object[]> {
      logger.info(`S3.listObjects: listing ${bucketName}:, prefix: ${prefix}`);
      let nextToken: string | undefined;
      const s3Objects: _Object[] = [];
      do {
        const s3ObjectList = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: nextToken,
        });
  
        const resp = await this.client.send(s3ObjectList);
        const data = resp?.Contents || [];
        if (data.length < 1) break;
        nextToken = resp?.ContinuationToken;
        s3Objects.push(...data);
      } while (nextToken);
  
      logger.info(`S3.listObjects: Found ${s3Objects.length} file(s)`);
  
      if (s3Objects.length === 0) {
        logger.error(`S3.listObjects: Found 0 files in S3`);
        throw Error;
      } else return s3Objects;
    }
  
    /**
     * Retrieves the contents of S3 files for a given IVR ID and capability ID
     * @param {string} bucketName - The name of the S3 bucket
     * @param {string} IVR_ID - The ID of the IVR
     * @param {string} CAPABILITY_ID - The ID of the capability
     * @returns {Promise<ContactFlow[]>} An array of ContactFlow objects
     */
    public async getS3Contents(
      bucketName: string,
      IVR_ID: string,
      CAPABILITY_ID: string
    ): Promise<ContactFlow[]> {
      const s3List = await this.s3ListObjects(bucketName, `${IVR_ID}/callflows/`);
      const s3Filter = s3List.filter((o) =>
        o.Key?.startsWith(`${IVR_ID}/callflows/${CAPABILITY_ID}`)
      );
      logger.info(`s3Filter`, { log_detail: s3Filter });
      const s3Contents: ContactFlow[] = [];
      try {
        for (const file of s3Filter) {
          const bodyContents = await this.readTextFile(bucketName, file.Key);
          const s3json: ContactFlow = JSON.parse(bodyContents);
          s3Contents.push(s3json);
        }
      } catch (error) {
        logger.error("s3.getS3Contents: Error ", error as Error);
        throw error;
      }
      return s3Contents;
    }
  
    /**
     * Retrieves the ContactFlow objects from the S3 contents
     * @param {ContactFlow[]} S3_CONTENTS - An array of ContactFlow objects
     * @returns {ContactFlow[]} An array of ContactFlow objects with specific properties
     */
    public async getS3Flows(S3_CONTENTS: ContactFlow[]): Promise<ContactFlow[]> {
      const S3_FLOWS = S3_CONTENTS.filter((o) => o.Type !== undefined).map(
        (o) => {
          return {
            Name: o.Name,
            Type: o.Type,
            Description: o.Description,
            Tags: o.Tags,
            Content: o.Content,
          };
        }
      );
  
      logger.info("Managers.getS3Flows: S3_FLOWS (currently in S3)", {
        log_detail: S3_FLOWS.map((o) => {
          return o.Name;
        }),
      });
      return S3_FLOWS;
    }
  
    /**
     * Retrieves the ContactFlowModule objects from the S3 contents
     * @param {ContactFlow[]} S3_CONTENTS - An array of ContactFlow objects
     * @returns {Promise<ContactFlowModule[]>} An array of ContactFlowModule objects
     */
    public async getS3FlowModules(
      S3_CONTENTS: ContactFlow[]
    ): Promise<ContactFlowModule[]> {
      const S3_FLOW_MODULES = S3_CONTENTS.filter((o) => o.Type === undefined).map(
        (o) => {
          return {
            Name: o.Name,
            Description: o.Description,
            Tags: o.Tags,
            Content: o.Content,
          };
        }
      );
  
      logger.info("Managers.getS3FlowModules: S3_FLOWS (currently in S3)", {
        log_detail: S3_FLOW_MODULES.map((o) => {
          return o.Name;
        }),
      });
      return S3_FLOW_MODULES;
    }
  }