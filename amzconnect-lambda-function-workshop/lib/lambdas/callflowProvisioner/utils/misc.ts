import { isEqual, difference } from "moderndash";
import fs from "fs";
import { Logger} from "@aws-lambda-powertools/logger";
import { ContactFlow } from "@aws-sdk/client-connect";
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner" });
const env = process.env.FUNCTION_ENV;

export const equality = (input: String[]) => {
    if (isEqual(input, [])) {
        return true;
    } else {
        return false;
    }
};

export const createFile = (file: any[]) => {
    try {
        fs.writeFileSync("/tmp/mappingFile.js", file.join("\n"));
    } catch (error) {
        logger.error("Error creating mappingFile", error as Error);
        throw error;
    }
};

export function isSubset(array1: any[], array2: any[]) {
    return array1.every(value => {
        if (!array2.includes(value)) {
        console.error(`${value} missing from Flow Vars`);
        throw Error(`${value} missing from Flow Vars`)
        }
        return array2.includes(value);
    });
}

export async function validateFlowVars(FLOW: ContactFlow, connectObject: Object) {
    let attributeMatches;
    let attributeRegEx = /\$\.FlowAttributes\.[a-zA-Z1-9_-]+/g;
    attributeMatches = [...FLOW.Content.matchAll(attributeRegEx)];
    // Remove FlowAttributes substring from matches using slice
    attributeMatches = attributeMatches.map((match) => match[0].slice(17));
    // logger.debug(`attributeMatches`, {log_detail: attributeMatches});
    const flowAttributes = Object.keys(connectObject)
    logger.info(`validating ${FLOW.Name} attributeMatches`, {log_detail: attributeMatches});
    const flowVarValidation = isSubset(attributeMatches, flowAttributes)
    if (flowVarValidation) {
        logger.info(`misc.validateFlowVars: ${FLOW.Name}: Flow Vars validated`);
    }
}
