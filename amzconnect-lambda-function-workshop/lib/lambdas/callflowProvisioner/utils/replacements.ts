import { Logger } from "@aws-lambda-powertools/logger";
const logger = new Logger({ logLevel: "INFO", serviceName: "provisioner" });

export interface Replacer {
    setNext(replacer: Replacer): Replacer;
    replace(json: string, connectObject: Object, connectObjMapTotal: Map<any, any>): string;
}

export class ReplacementEngine implements Replacer {
    private nextReplacer: Replacer;

    setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer;
    }

    replace(json: string, connectObject: Object, connectObjMapTotal: Map<any, any>): string {
        if(this.nextReplacer) {
        return this.nextReplacer.replace(json, connectObject, connectObjMapTotal);  
        }
        return json;
    }
}

export class FunctionObjectMapsReplacer implements Replacer {

    private nextReplacer: Replacer;

    setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer; 
    }

    replace(json: string, connectObject: Object, connectObjMapTotal: Map<any, any>): string {
        let flowObj = JSON.parse(json);
        // * Search for correct Object Maps attribute value and replace with json representation of Connect resources
        const _act = flowObj.Actions.filter(
            (object: any) => object.Identifier === "FLOW_OBJECT_MAPS#",
        );
        if (_act.length > 0) {
            const replaceAction = (_act[0].Parameters.FlowAttributes =
                connectObject);
            logger.debug("replacements.FunctionObjectMapsReplacer: replaceAction", { _act: _act });
            Object.assign(_act, replaceAction); // nosemgrep: javascript.lang.security.insecure-object-assign.insecure-object-assign
            logger.debug("replacements.FunctionObjectMapsReplacer: Found Object Maps in contact flow", {log_detail: flowObj });
        }
        
        if(this.nextReplacer) {
        return this.nextReplacer.replace(JSON.stringify(flowObj), connectObject, connectObjMapTotal);
        }
        return JSON.stringify(flowObj);
    } 

}

export class PromptReplacer implements Replacer {

    private nextReplacer: Replacer;

    setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer; 
        }

    replace(json: string, connectObject: Object, connectObjMapTotal: Map<any, any>): string {
        if(json.includes("PROMPT#")) {
            let arn, prompts;
            let promptRegEx = /PROMPT#[a-zA-Z1-9_]+/g;
            prompts = [...json.matchAll(promptRegEx)];
            // console.debug(`${flow.Name}.replacePROMPT.findPrompt: `, findPrompt[0]);
            for (let prompt in prompts) {
                let promptName = prompts[prompt][0].split("#")[1];
                arn = connectObjMapTotal.get(promptName);
                if (arn == undefined) {
                    logger.error(
                        `replacements.PromptReplacer.${promptName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                    throw Error(
                        `replacements.PromptReplacer.${promptName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                }

                json = json.replace(promptRegEx, arn);
                logger.info(
                    `replacements.PromptReplacer: replaced PROMPT# placeholder with arn for ${promptName}: ${arn}`,
                );
            }
        }
        if(this.nextReplacer) {
            return this.nextReplacer.replace(json, connectObject, connectObjMapTotal);
        }
        return json;
        }
}

export class QueueReplacer implements Replacer {

    private nextReplacer: Replacer;

    setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer; 
        }

    replace(json: string,connectObject: Object, connectObjMapTotal: Map<any, any>): string {
        if(json.includes("QUEUE#")) {
            let arn, prompts;
            let queueRegEx = /QUEUE#[a-zA-Z1-9_]+/g;
            prompts = [...json.matchAll(queueRegEx)];
            // console.debug(`${flow.Name}.replaceQUEUE.prompts: `, prompts[0])
            for (let queue in prompts) {
                let queueName = prompts[queue][0].split("#")[1];
                arn = connectObjMapTotal.get(queueName);
                if (arn == undefined) {
                    logger.error(
                        `replacements.QueueReplacer.${queueName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                    throw Error(
                        `replacements.QueueReplacer.${queueName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                }
                json = json.replace(queueRegEx, arn);
                logger.info(
                    `replacements.QueueReplacer: replaced QUEUE# placeholder with arn for ${queueName}: ${arn}`,
                );
            }
        }
        if(this.nextReplacer) {
            return this.nextReplacer.replace(json, connectObject, connectObjMapTotal);
        }
        return json;
        }

}

export class FunctionReplacer implements Replacer {

    private nextReplacer: Replacer;

    setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer; 
        }

    replace(json: string, connectObject: Object, connectObjMapTotal: Map<any, any>): string {
        if(json.includes("FUNCTION#")) {
            let arn, prompts;
            let functionRegEx = /FUNCTION#[a-zA-Z1-9_-]+/g;
            prompts = [...json.matchAll(functionRegEx)];
            // console.info(`${flow.Name}.replacePROMPT.prompts: `, prompts[0][0]);
            for (let f in prompts) {
                let functionName = prompts[f][0].split("#")[1];
                arn = connectObjMapTotal.get(functionName);
                if (arn == undefined) {
                    logger.error(
                        `replacements.FunctionReplacer.${functionName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                    throw Error(
                        `replacements.FunctionReplacer.${functionName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                }
        
                json = json.replace(functionRegEx, arn);
                logger.info(
                    `replacements.FunctionReplacer: replaced FUNCTION# placeholder with arn for ${functionName}: ${arn}`,
                );
            }
        }
        if(this.nextReplacer) {
            return this.nextReplacer.replace(json, connectObject, connectObjMapTotal);
        }
        return json;
        }

}

export class FlowReplacer implements Replacer {

    private nextReplacer: Replacer;

    setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer; 
        }

    replace(json: string, connectObject: Object, connectObjMapTotal: Map<any, any>): string {
        if(json.includes("FLOW#")) {
            let arn, prompts;
            let flowRegEx = /FLOW#[a-zA-Z1-9_' ]+/g;
            prompts = [...json.matchAll(flowRegEx)];
            for (let flowitem in prompts) {
                arn = "";
                // console.log(`replaceFLOW.flowitem: `, prompts[flowitem])
                let flowName = prompts[flowitem][0].split("#")[1];
                // * String replace is done for the default flows which have spaces in names.
                // * In template the names are wrapped with single quotes and removing them here.
                flowName = flowName.replace(/[']/g, "");
                arn = connectObjMapTotal.get(flowName);
                if (arn == undefined) {
                    logger.error(
                        `replacements.FlowReplacer.${flowName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                    throw Error(
                        `replacements.FlowReplacer.${flowName}.Arn is undefined. Check instance to make sure it exists`,
                    );
                }
                json = json.replace(flowRegEx, arn);
                logger.info(
                    `replacements.FlowReplacer replaced FLOW# placeholder with arn for ${flowName}: ${arn}`,
                );
            }
        }
        if(this.nextReplacer) {
            return this.nextReplacer.replace(json, connectObject, connectObjMapTotal);
        }
        return json;
        }

}


