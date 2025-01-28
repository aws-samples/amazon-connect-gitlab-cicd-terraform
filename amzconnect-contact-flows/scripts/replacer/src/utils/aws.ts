import { S3Client } from "@aws-sdk/client-s3";
import { ConnectClient } from "@aws-sdk/client-connect";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { LexModelsV2Client } from "@aws-sdk/client-lex-models-v2";
import { QConnectClient } from "@aws-sdk/client-qconnect";
import { ConfiguredRetryStrategy } from "@smithy/util-retry";

export function getS3Client(region: string): S3Client {
    return new S3Client({
        region,
        retryStrategy: new ConfiguredRetryStrategy(
            4, // used.
            (attempt: number) => 100 + attempt * 1000, // backoff function.
        ),
    });
}

export function getConnectClient(region: string): ConnectClient {
    return new ConnectClient({
        region,
        retryStrategy: new ConfiguredRetryStrategy(
            4, // used.
            (attempt: number) => 100 + attempt * 1000, // backoff function.
        ),
    });
}

export function getLambdaClient(region: string): LambdaClient {
    return new LambdaClient({
        region,
        retryStrategy: new ConfiguredRetryStrategy(
            4, // used.
            (attempt: number) => 100 + attempt * 1000, // backoff function.
        ),
    });
}

export function getLexClient(region: string): LexModelsV2Client {
    return new LexModelsV2Client({
        region,
        retryStrategy: new ConfiguredRetryStrategy(
            4, // used.
            (attempt: number) => 100 + attempt * 1000, // backoff function.
        ),
    });
}

export function getQiCClient(region: string): QConnectClient {
    return new QConnectClient({
        region,
        retryStrategy: new ConfiguredRetryStrategy(
            4, // used.
            (attempt: number) => 100 + attempt * 1000, // backoff function.
        ),
    });
}
