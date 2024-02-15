import { ContactFlow } from "@aws-sdk/client-connect";
import {
    updateContactFlow,
} from "./connect";
import {
    ReplacementEngine,
    FunctionObjectMapsReplacer,
    PromptReplacer,
    QueueReplacer,
    FunctionReplacer,
    FlowReplacer
} from "./replacements"
import { difference } from "moderndash";
import { equality} from "./misc";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner" });
const env = process.env.FUNCTION_ENV;


// * function merges two arrays of contact flows. if array one is same as array two everything fine.
// * if array 2 is for some reason larger then 2nd pass needed with commented code.
// * The way function is used here, the arrays have identical objects, however contact flow content is different.
export const mergeContactFlowArrays = (
    a1: Array<ContactFlow>,
    a2: Array<ContactFlow>,
) => {
    return a1.map((x) => {
        const y = a2.find((item) => x.Name === item.Name);
        if (y) {
            return Object.assign({}, x, y);
        } else return x;
    });
    // .concat(a2.filter(item => a1.every( x => x.name !== item.name)));
};


export async function createFlowAtt(FLOW_CONTENT:string, connectObject: Object) {
    let flowObj = JSON.parse(FLOW_CONTENT);
    // * Search for correct Object Maps attribute value and replace with json representation of Connect resources
    const _act = flowObj.Actions.filter(
        (object: any) => object.Identifier === "FLOW_OBJECT_MAPS#",
    );
    if (_act.length > 0) {
        const replaceAction = (_act[0].Parameters.FlowAttributes =
            connectObject);
        logger.info("contactflow.replaceFlowMaps: replaceAction", {log_detail: replaceAction, connectObject: connectObject, _act: _act });
        Object.assign(_act, replaceAction); // nosemgrep: javascript.lang.security.insecure-object-assign.insecure-object-assign
        logger.info("contactflow.replaceFlowMaps: Found Object Maps in contact flow", {log_detail: flowObj });
    }
    return JSON.stringify(flowObj)
}


export async function createContactAtt(FLOW_CONTENT:string, connectObject: Object) {
    let flowObj = JSON.parse(FLOW_CONTENT);
    // * Search for correct Object Maps attribute value and replace with json representation of Connect resources
    // * Since we are parsing JSON object at beginning, we need to stringify the return
    const _act = flowObj.Actions.filter(
        (object: any) => object.Identifier === "OBJECT_MAPS#",
    );
    if (_act.length > 0) {
        const replaceAction = (_act[0].Parameters.Attributes =
            connectObject);
        logger.info("contactflow.replaceFlowMaps: replaceAction", {log_detail: replaceAction, connectObject: connectObject, _act: _act });
        Object.assign(_act, replaceAction); // nosemgrep: javascript.lang.security.insecure-object-assign.insecure-object-assign
        logger.info("contactflow.replaceFlowMaps: Found Object Maps in contact flow", {log_detail: flowObj });
    }
    return JSON.stringify(flowObj)
}


export async function reMapObjectToFlowAtt(connectObject: Object) {
    let newObject = Object.fromEntries(
        Object.entries(connectObject).map(([key, val]) => [key, {"Value": val}]),
      );
    // const newObject1 = Object.fromEntries(newArray)
    logger.info("contactflow.reMapObjectToFlowAtt: ", {newObject: newObject})
    return newObject
}


