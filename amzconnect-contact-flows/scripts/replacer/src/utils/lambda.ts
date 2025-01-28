import {
  ListFunctionsCommand,
  FunctionConfiguration,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { getLambdaClient } from "./aws";
// import { Utils } from "./misc";

const region = process.env.AWS_REGION;
// const env = process.env.FUNCTION_ENV;
const logger = new Logger({ serviceName: "provisioner.lambda" });

const regionShortNames = new Map([
  ["us-east-1", "use1"],
  ["us-west-2", "usw2"],
]);
const regionShortName = regionShortNames.get(region);
/**
 * Class to manage Lambda functions
 */
export class LambdaManager {
  private client: LambdaClient;

  constructor() {
    this.client = getLambdaClient(region);
  }

  public async listAllFunctions(): Promise<Map<string, string>> {
    let nextToken: string | undefined;
    const functions: FunctionConfiguration[] = [];
    do {
      const lambdaList = new ListFunctionsCommand({ Marker: nextToken });
      const lambdaResp = await this.client.send(lambdaList);
      const data = lambdaResp?.Functions || [];
      if (data.length < 1) break;
      nextToken = lambdaResp?.NextMarker;
      functions.push(...data);
    } while (nextToken);
    const functionMap = this.mapFunctionsToArns(functions);
    return functionMap;
  }

  private mapFunctionsToArns(
    functions: FunctionConfiguration[],
  ): Map<string, string> {
    const localObjMap = new Map();
    for (const i of functions) {
      localObjMap.set(i.FunctionName, i.FunctionArn);
      if (i.FunctionName.endsWith(`-${regionShortName}`)) {
        const trimmed = i.FunctionName.replace(`-${regionShortName}`, "");
        localObjMap.set(trimmed, i.FunctionArn);
      }
    }
    logger.info("LambdaManager.mapFunctionsToArns: ", {
      detail: Object.fromEntries(localObjMap),
    });
    return localObjMap;
  }
}
