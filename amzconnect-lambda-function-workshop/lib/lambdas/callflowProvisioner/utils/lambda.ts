import {
    LambdaClient,
    UpdateFunctionCodeCommand,
    ListFunctionsCommand,
    FunctionConfiguration,
    Lambda
} from "@aws-sdk/client-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { ConfiguredRetryStrategy } from "@smithy/util-retry";
import { trimEnd } from "moderndash";
const region = process.env.AWS_REGION;
const env = process.env.FUNCTION_ENV;
const account = process.env.FUNCTION_ACCOUNT;
const logLevel = process.env.LOG_LEVEL || "INFO";
const tracer = new Tracer({ serviceName: "provisioner.lambda" });
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner.lambda" });

// Initialize Clients
const lambdaclient = tracer.captureAWSv3Client(
    new LambdaClient({
         region: region,
         retryStrategy: new ConfiguredRetryStrategy(
            4, // max attempts
            (attempt: number) => 100 + attempt * 1000 // backoff function.
          ),
        }),
);

export async function listLambdaFunctions(INSTANCE_ID: string, NAMING_PREFIX: string, CAPABILITY_ID: string, IVR_ID: string, level?:string) {
    // this function should allow for marker and next marker
    const localObjMap = new Map();
    //*  Get List of Lambda Functions.
    try {
        let nextToken: string | undefined;
        const functions: FunctionConfiguration[] = []
        do {
            const lambdaList = new ListFunctionsCommand({ Marker: nextToken });
            const lambdaResp = await lambdaclient.send(lambdaList);
            const data = lambdaResp?.Functions || []
            if(data.length < 1) break;
            nextToken = lambdaResp?.NextMarker;
            functions.push(...data);
        } while(nextToken);

        logger.info(`Lambda.listLambdaFunctions: Found ${functions.length} functions`);

        if (level == "ALL") {
            for (const i of functions) {
                localObjMap.set(i.FunctionName, i.FunctionArn);
            }
            logger.info("Lambda.listLambdaFunctions.All: ", { log_detail: Object.fromEntries(localObjMap) });
            return localObjMap
        } else {
            let filteredLambdaList = functions.filter((o) =>
            o.FunctionName.startsWith(`${NAMING_PREFIX}`) || o.FunctionName.startsWith(`${CAPABILITY_ID}`),
            );
            for (const i of filteredLambdaList) {
                localObjMap.set(i.FunctionName, i.FunctionArn);
            }
            let filteredLambdaListByIVR = functions.filter((o) =>
            o.FunctionName.startsWith(`${CAPABILITY_ID}`) && o.FunctionName.endsWith(`${IVR_ID}-${env}`)
            );
            for (const i of filteredLambdaListByIVR) {
                localObjMap.set(trimEnd(i.FunctionName, `-${IVR_ID}-${env}`), i.FunctionArn);
            }
            logger.info("Lambda.listLambdaFunctions.LambdaListByIVR", {log_detail: filteredLambdaListByIVR.map(
                (o: FunctionConfiguration) => {
                    return o.FunctionName;
                },
            )})
            logger.info("Lambda.listLambdaFunctions.Filtered: ", { log_detail: Object.fromEntries(localObjMap) });
            return localObjMap
        }
    } catch (error) {
        logger.error("Error listing prompts", error as Error);
        throw error;
    }
    return localObjMap
}
