import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    _Object
} from "@aws-sdk/client-s3";
import {
    ContactFlow
} from "@aws-sdk/client-connect";
import { ConfiguredRetryStrategy } from "@smithy/util-retry";
import { Readable } from "stream";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";

const region = process.env.AWS_REGION;
const tracer = new Tracer({ serviceName: "provisioner" });
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner" });

// Initialize Client
const s3client = tracer.captureAWSv3Client(
    new S3Client({
        region: region,
        retryStrategy: new ConfiguredRetryStrategy(
            4, // used.
            (attempt: number) => 100 + attempt * 1000, // backoff function.
        ),
    }),
);

export async function readTextFile(bucket: string, key: string) {
    const asString = (stream: Readable) => {
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.once("end", () => resolve(Buffer.concat(chunks)));
            stream.once("error", reject);
        });
    };
    logger.info(`S3.readTextFile: reading  ${key}`);
    const { Body } = await s3client.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        }),
    );

    return (await asString(Body as Readable)).toString("utf-8");
}

export const s3ListObjects = async (bucketName: string, prefix?: string) => {
    logger.info(
        `S3.listObjects: listing ${bucketName}:, prefix: ${prefix}`,
    );
    let nextToken: string | undefined;
    const s3Objects: _Object[] = []
    do {
        const s3ObjectList = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: nextToken
        });
        
        const resp = await s3client.send(s3ObjectList);
        const data = resp?.Contents || []
        if(data.length < 1) break;
        nextToken = resp?.ContinuationToken;
        s3Objects.push(...data);
    } while(nextToken);

    logger.info(`S3.listObjects: Found ${s3Objects.length} file(s)`);

    if (s3Objects.length == 0) {
        logger.error(`S3.listObjects: Found 0 files in S3`);
        throw Error
    } else return s3Objects;
};

export const getS3Contents = async (bucketName: string, IVR_ID: string, CAPABILITY_ID: string) => {
    let s3List = await s3ListObjects(bucketName, `${IVR_ID}/callflows/`);
    let s3Filter = s3List.filter((o) => o.Key?.startsWith(`${IVR_ID}/callflows/${CAPABILITY_ID}`));
    logger.info(`s3Filter`, {log_detail: s3Filter})
    const s3Contents = [];
    try {
        for (const file of s3Filter  ) {
            const bodyContents = await readTextFile(bucketName, file.Key);
            const s3json: ContactFlow = JSON.parse(bodyContents);
            s3Contents.push(s3json);
        }       
    } catch (error) {
        logger.error("s3.getS3Contents: Error ", error as Error);
        throw error;
    }
    return s3Contents;
};

export async function getS3Flows(S3_CONTENTS: ContactFlow[]) {
    const S3_FLOWS = S3_CONTENTS.filter((o) => o.Type != undefined).map((o) => {
        return {
            Name: o.Name,
            Type: o.Type,
            Description: o.Description,
            Tags: o.Tags,
            Content: o.Content,
        };
    });

    logger.info("Managers.getS3Flows: S3_FLOWS (currently in S3)", {
        log_detail: S3_FLOWS.map((o) => {
            return o.Name;
        }),
    });
    return S3_FLOWS
}

export async function getS3FlowModules(S3_CONTENTS: ContactFlow[]) {
    const S3_FLOW_MODULES = S3_CONTENTS.filter((o) => o.Type == undefined).map((o) => {
        return {
            Name: o.Name,
            Description: o.Description,
            Tags: o.Tags,
            Content: o.Content,
        };
    });

    logger.info("Managers.getS3FlowModules: S3_FLOWS (currently in S3)", {
        log_detail: S3_FLOW_MODULES.map((o) => {
            return o.Name;
        }),
    });
    return S3_FLOW_MODULES
}
