import { S3Client } from '@aws-sdk/client-s3';
import { ConnectClient } from '@aws-sdk/client-connect';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { LexModelsV2Client } from '@aws-sdk/client-lex-models-v2';
import { Tracer } from "@aws-lambda-powertools/tracer";
const tracer = new Tracer({ serviceName: "provisioner" });

export function getS3Client(region: string): S3Client {
    return new S3Client({ region });
}

export function getConnectClient(region: string): ConnectClient {
    return new ConnectClient({ region });
}

export function getLambdaClient(region: string): LambdaClient {
    return tracer.captureAWSv3Client(new LambdaClient({ region }));
}

export function getLexClient(region: string): LexModelsV2Client {
    return new LexModelsV2Client({ region });
}
