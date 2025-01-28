import { Logger } from "@aws-lambda-powertools/logger";
import { ContactFlow } from "@aws-sdk/client-connect";
import fs from "fs";
import path from "path";
const logger = new Logger({ serviceName: "Replacer" });
const ACCOUNT = "${ACCT_ID}";
const REGION = "${REGION}";
const INSTANCE = "${INSTANCE_ID}";
const STAGE = "${STAGE}";

type ContactFlowContent = {
    Version: string;
    StartAction: string;
    Metadata: {
        entryPointPosition: { x: number; y: number };
        ActionMetadata: any;
        snapToGrid?: boolean;
        Annotations?: any[];
        name?: string;
        description?: string;
        type?: string;
        status?: string;
        hash?: any;
    };
    Actions: any[];
};

/**
 * Interface for replacer objects that can replace placeholders in JSON
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export abstract class Replacer {
    // constructor(){}
    nextReplacer: Replacer;

    /**
     * Sets the next Replacer in the chain of responsibility
     * @param replacer - The next Replacer object
     * @returns The Replacer that was passed in
     */
    public setNext(replacer: Replacer): Replacer {
        this.nextReplacer = replacer;
        return replacer;
    }

    public abstract replace(
        json: string,
        accountId: string,
        region: string,
        instanceId: string,
        stage: string,
        // connectObject: object,
        invObject: Map<string, string>,
    ): string;

    protected objectToMap(obj: { [key: string]: any }): Map<string, any> {
        const map = new Map();
        for (const key in obj) {
            map.set(key, obj[key]);
        }
        return map; // Should just be const x = new Map(Object.entries(object))
    }

    /**
     * Remaps an object's key/value pairs to a new format suitable for a Connect flow attribute object.
     *
     * @param {object} connectObject - The object to remap.
     * @returns {Promise<object>} A Promise that resolves to the remapped object.
     *
     * @remarks
     * This function takes an input object of key/value pairs and remaps it so that each value
     * is wrapped in a "Value" property, as is required for flow attribute objects in Amazon Connect.
     *
     * For example:
     * ```
     * {
     *   "name": "John",
     *   "id": 12345
     * }
     * ```
     *
     * Would be remapped to:
     * ```
     * {
     *   "name": {"Value": "John"},
     *   "id": {"Value": 12345}
     * }
     * ```
     *
     * It wraps the remapping in a Promise using the `async` keyword,
     * so calling code should await or chain off the return value.
     */
    protected reMapObjectToFlowAtt(connectObject: object) {
        const newObject = Object.fromEntries(
            Object.entries(connectObject).map(([key, val]) => [
                key,
                { Value: val },
            ]),
        );
        logger.debug("replacer.reMapObjectToFlowAtt: ", {
            newObject: newObject,
        });
        return newObject;
    }

    // /**
    //  * Checks if array1 is a subset of array2
    //  * @param {any[]} array1 - The array to check if it is a subset
    //  * @param {any[]} array2 - The array to check against
    //  * @returns {boolean} - Returns true if array1 is a subset of array2
    //  * Function is used within validateFlowVars()
    //  */
    // public isSubset(array1: any[], array2: any[]): boolean {
    //     return array1.every((value) => {
    //         if (!array2.includes(value)) {
    //             console.error(`${value} missing from Connect Mapping Object`);
    //             throw Error(`${value} missing from Connect Mapping Object`);
    //         }
    //         return array2.includes(value);
    //     });
    // }
    // /**
    //  * Validates if Contact Flow attributes match Flow variables
    //  * @param {ContactFlow} FLOW - The Contact Flow object
    //  * @param {object} connectObject - The Connect object containing Flow variables
    //  */
    // public validateFlowVars(FLOW: ContactFlow, connectObject: object) {
    //     const remappedConnectObject = this.reMapObjectToFlowAtt(connectObject);
    //     logger.debug(`validateFlowVars for ${FLOW.Name}`);
    //     let attributeMatches;
    //     const attributeRegEx = /\$\.FlowAttributes\.[a-zA-Z1-9' _-]+/g;
    //     attributeMatches = [...FLOW.Content.matchAll(attributeRegEx)];
    //     // Remove FlowAttributes substring from matches using slice
    //     attributeMatches = attributeMatches.map((match) => match[0].slice(17));
    //     logger.info(`validateFlowVars.attributeMatches`, {
    //         log_detail: attributeMatches,
    //     });
    //     const flowAttributes = Object.keys(remappedConnectObject);
    //     logger.debug(
    //         `validateFlowVars: ${FLOW.Name} remappedConnectObject flowAttributes`,
    //         { log_detail: flowAttributes },
    //     );
    //     const flowVarValidation = this.isSubset(
    //         attributeMatches,
    //         flowAttributes,
    //     );
    //     if (flowVarValidation) {
    //         logger.info(`validateFlowVars: ${FLOW.Name}: Flow Vars validated`);
    //     }
    //     // return flowVarValidation
    // }
    // *  This method will clean extraneous keys from Contact Flow Content Metadata that
    // *  were inadvertently checked in
    public cleanMetadata(
        contactFlowContent: ContactFlowContent,
    ): ContactFlowContent {
        const { Metadata } = contactFlowContent;

        const cleanedMetadata = {
            entryPointPosition: Metadata.entryPointPosition,
            ActionMetadata: Metadata.ActionMetadata,
        };

        return {
            ...contactFlowContent,
            Metadata: cleanedMetadata,
        };
    }

    public replacePlaceholder(
        json: string,
        mapObject: Map<string, string>,
    ): string {
        const regEx = /\${[FHMPQA]:([a-zA-Z1-9_ .]+):[FHMPQA]}/g;
        if (json.match(regEx)) {
            let arn;
            const matches = [...json.matchAll(regEx)];
            for (const match of matches) {
                const placeholderValue = match[0];
                const resource = match[1];

                arn = mapObject.get(resource.replace(".wav", ""));
                if (arn == undefined) {
                    console.error(
                        `replacePlaceholder ${resource} Arn is undefined. Check instance to make sure it exists`,
                    );
                    throw Error(
                        `replacePlaceholder ${resource} Arn is undefined. Check instance to make sure it exists`,
                    );
                }
                const guid = arn.split("/").pop();
                json = json.replace(placeholderValue, guid);
                console.log(
                    `replacePlaceholder: replaced placeholder with arn for ${resource}: ${guid}`,
                );
            }
        }
        return json;
    }

    public replaceBotReferences(
        json: string,
        mapObject: Map<string, string>,
    ): string {
        const regEx = /:bot-alias\/([a-zA-Z0-9/-]+)/g;
        if (json.match(regEx)) {
            let arn;
            const matches = [...json.matchAll(regEx)];
            for (const match of matches) {
                // const placeholderValue = match[0];
                const resource = match[1];

                arn = mapObject.get(resource);
                if (arn == undefined) {
                    console.error(
                        `replaceBotReferences ${resource} Arn is undefined. Check instance to make sure it exists`,
                    );
                    throw Error(
                        `replaceBotReferences ${resource} Arn is undefined. Check instance to make sure it exists`,
                    );
                }
                const alias = arn.split("bot-alias/").pop();
                json = json.replace(resource, alias);
                console.log(
                    `replaceBotReferences: replaced bot reference with arn for ${resource}: ${alias}`,
                );
            }
        }
        return json;
    }

    public replaceAll(s: string, pattern: string, replacement: string) {
        return s.replaceAll(pattern, replacement);
    }

    public replaceRegionInArns(json: string): string {
        const regionStrings = [
            "arn:aws:lambda:us-east-1:",
            "arn:aws:lambda:us-west-2:",
            "arn:aws:lambda:eu-central-1:",
            "arn:aws:lambda:eu-west-2:",
            "arn:aws:lex:us-east-1:",
            "arn:aws:lex:us-west-2:",
            "arn:aws:lex:eu-central-1:",
            "arn:aws:lex:eu-west-2:",
        ];
        const regionPlaceholder = "$.AwsRegion";

        let updatedJson = json;
        for (const regionString of regionStrings) {
            const regex = new RegExp(regionString, "g");
            updatedJson = updatedJson.replaceAll(
                regex,
                `arn:aws:${regionString.split(":")[2]}:${regionPlaceholder}:`,
            );
        }

        return updatedJson;
    }

    protected captureFlowAttributeKeys(json: string): string[] {
        const attributeKeys = new Set<string>();
        const parsedJson = JSON.parse(json);

        parsedJson.Actions.forEach((action) => {
            if (
                action.Identifier !== "FLOW_OBJECT_MAPS#" &&
                action.Parameters?.FlowAttributes
            ) {
                Object.keys(action.Parameters.FlowAttributes).forEach((key) =>
                    attributeKeys.add(key),
                );
            }
        });

        return Array.from(attributeKeys);
    }

    protected findOverlaps(arr: string[], map: Map<string, string>): string[] {
        const overlaps: string[] = [];

        arr.forEach((item) => {
            if (map.has(item)) {
                overlaps.push(item);
                console.log(`Match found: ${item}`);
            }
        });

        return overlaps;
    }
}

/**
 * Base replacer class that can be extended. Handles chaining replacers together.
 */
export class ReplacementEngine extends Replacer {
    constructor() {
        super();
    }

    /**
     * Replaces placeholders in the JSON if it can, otherwise passes the job
     * to the next Replacer in the chain
     * @param json - The JSON contact flow to replace placeholders in
     * @param connectObject - The connectObject mapping object
     * @returns The updated JSON string after replacement
     */
    replace(
        json: string,
        accountId: string,
        region: string,
        instanceId: string,
        stage: string,
        invObject: Map<string, string>,
    ): string {
        if (this.nextReplacer) {
            return this.nextReplacer.replace(
                json,
                accountId,
                region,
                instanceId,
                stage,
                invObject,
            );
        }
        return json;
    }
}

export class FunctionObjectMapsReplacer extends Replacer {
    constructor() {
        super();
    }

    /**
     * Replaces placeholders in the JSON if it can, otherwise passes the job
     * to the next Replacer in the chain
     * @param json - The JSON contact flow to replace placeholders in
     * @param connectObject - The connectObject mapping object. Is only used by FunctionObjectMapsReplacer
     * @returns The updated JSON string after replacement
     */
    replace(
        json: string,
        accountId: string,
        region: string,
        instanceId: string,
        stage: string,
        invObject: Map<string, string>,
    ): string {
        let flowObj: any = {};
        try {
            flowObj = JSON.parse(json);
        } catch (e) {
            throw Error(
                `The contact flow passed in is in the incorrect format. It needs to be a stringified JSON so that it can be parsed. Please check the format.`,
            );
        } // Check content format, the cli-exporter are stringified
        const attributeMatches: string[] = [];
        const customFlowObject = new Map();
        const regEx = /\$\.FlowAttributes.([\[\]\/a-zA-Z1-9' _-]+)/g;
        let remappedConnectObject = {};
        const flowVariables = this.captureFlowAttributeKeys(json);
        logger.info("flowvars", { detail: flowVariables });
        if (json.match(regEx)) {
            const matches = [...json.matchAll(regEx)];
            for (const match of matches) {
                const resource = match[1];
                attributeMatches.push(resource);

                const arn = invObject.get(resource);
                if (arn == undefined) {
                    if (flowVariables.includes(resource)) {
                        console.log(
                            `FunctionObjectMapsReplacer: ${match} is used as a variable in flow`,
                        );
                    } else {
                        console.error(
                            `FunctionObjectMapsReplacer: ${match} Arn is undefined. Check instance to make sure it exists`,
                        );
                        throw Error(
                            `FunctionObjectMapsReplacer: ${match} Arn is undefined. Check instance to make sure it exists`,
                        );
                    }
                } else {
                    customFlowObject.set(resource, arn);
                }
            }
            logger.info(`FunctionObjectMapsReplacer.attributeMatches`, {
                log_detail: attributeMatches,
            });

            const overlaps = this.findOverlaps(flowVariables, customFlowObject);
            if (overlaps.length > 0) {
                logger.error(
                    `FunctionObjectMapsReplacer: Overlaps found in variables overwriting a FLOW_OBJECT_MAP item. Please rename the variables below`,
                    {
                        log_detail: overlaps,
                    },
                );
                throw Error(
                    `FunctionObjectMapsReplacer: Overlaps found in variables overwriting a FLOW_OBJECT_MAP item. Please rename the variables below`,
                );
            }

            remappedConnectObject = super.reMapObjectToFlowAtt(
                Object.fromEntries(customFlowObject),
            );
            // * Search for correct Object Maps attribute value and replace with json representation of Connect resources
            const _act = flowObj.Actions.filter(
                (object: any) => object.Identifier === "FLOW_OBJECT_MAPS#",
            );
            if (_act.length > 0) {
                const replaceAction = (_act[0].Parameters.FlowAttributes =
                    remappedConnectObject);
                logger.info(
                    "replacements.FunctionObjectMapsReplacer: replaceAction",
                    {
                        _act: _act,
                    },
                );
                Object.assign(_act, replaceAction);
                logger.debug(
                    "replacements.FunctionObjectMapsReplacer: Found Object Maps in contact flow",
                    { log_detail: flowObj },
                );
            }
        }
        if (attributeMatches.length == 0) {
            logger.info(
                "replacements.FunctionObjectMapsReplacer: No Dynamic attributes found. Skipping Object Map replacement",
            );
        }
        logger.debug(`remappedConnectObject`, remappedConnectObject);

        if (this.nextReplacer) {
            return this.nextReplacer.replace(
                JSON.stringify(flowObj),
                accountId,
                region,
                instanceId,
                stage,
                invObject,
            );
        }
        return JSON.stringify(flowObj);
    }
}
export class placeholderReplacer extends Replacer {
    constructor() {
        super();
    }

    /**
     * Replaces placeholders in the JSON if it can, otherwise passes the job
     * to the next Replacer in the chain
     * @param json - The JSON contact flow to replace placeholders in
     * @param connectObject - The connectObject mapping object. Is only used by FunctionObjectMapsReplacer
     * @returns The updated JSON string after replacement
     */
    replace(
        json: string,
        accountId: string,
        region: string,
        instanceId: string,
        stage: string,
        invObject: Map<string, string>,
    ): string {
        json = super.replaceAll(json, ACCOUNT, accountId);
        json = super.replaceAll(json, REGION, region);
        json = super.replaceAll(json, INSTANCE, instanceId);
        json = super.replaceAll(json, STAGE, stage);
        json = super.replacePlaceholder(json, invObject);
        json = super.replaceBotReferences(json, invObject);
        json = super.replaceRegionInArns(json);

        if (this.nextReplacer) {
            return this.nextReplacer.replace(
                json,
                accountId,
                region,
                instanceId,
                stage,
                invObject,
            );
        }
        return json;
    }
}

/**
 * Returns contact flow doing nothing
 */
export class NoOpReplacer extends Replacer {
    replace(
        json: string,
        accountId: string,
        region: string,
        instanceId: string,
        stage: string,
        invObject: Map<string, string>,
    ): string {
        if (this.nextReplacer) {
            return this.nextReplacer.replace(
                json,
                accountId,
                region,
                instanceId,
                stage,
                invObject,
            );
        }
        return json;
    }
}

export class ContactFlowBuilder {
    private logger = new Logger({ serviceName: "ContactFlowBuilder" });

    private region: string;
    private env: string;
    //   private CAPABILITY_ID: string;
    private IVR_ID: string;
    private _capabilityReplacer: Replacer;
    // set
    /**
     * Constructor
     */
    constructor(
        region: string,
        env: string,
        // CAPABILITY_ID: string,
        IVR_ID: string,
        capabilityReplacer?: Replacer,
    ) {
        this.region = region;
        this.env = env;
        // this.CAPABILITY_ID = CAPABILITY_ID;
        this.IVR_ID = IVR_ID;
        if (capabilityReplacer) {
            this._capabilityReplacer = capabilityReplacer;
        } else {
            this._capabilityReplacer = new NoOpReplacer();
            logger.info(
                "ContactFlowBuilder: No capability replacer provided, using NoOpReplacer",
            );
        }

        this.logger.info("Constructor:", {
            region: this.region,
            env: this.env,
            //   CAPABILITY_ID: this.CAPABILITY_ID,
            IVR_ID: this.IVR_ID,
        });
    }

    /**
     * Gets contact flows from directory
     * @param {string} dir - Directory path
     * @returns {ContactFlow[] | null} Array of contact flows or null if error
     */

    public getContactFlows(dir: string): ContactFlow[] | null {
        const contactFlows: ContactFlow[] = [];
        try {
            // Get the list of files and directories in the current directory
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            console.log(
                `traversing ${dir}: entries ${entries.map((entry) => entry.name)}`,
            );
            // Process the files in the current directory
            const filesInCurrentDir = entries
                .filter(
                    (entry) =>
                        entry.isFile() && path.extname(entry.name) === ".json",
                )
                .map((entry) => {
                    const filePath = path.join(dir, entry.name);
                    const fileContent = fs.readFileSync(filePath, "utf8");
                    return JSON.parse(fileContent);
                });

            contactFlows.push(...filesInCurrentDir);
            // Recursively process the subdirectories (up to one level)
            const subdirs = entries.filter((entry) => entry.isDirectory());
            for (const subdir of subdirs) {
                const subdirPath = path.join(dir, subdir.name);
                const flowsInSubdir = this.getContactFlows(subdirPath);
                if (flowsInSubdir) {
                    contactFlows.push(...flowsInSubdir);
                }
            }
        } catch (error) {
            logger.error(`Could not read directory ${dir}: ${error}`);
            return null;
        }
        const flowNames = contactFlows.map((flow) => flow.Name);
        console.log(`files in current dir + subdir: `, flowNames);
        return contactFlows;
    }

    /**
     * Writes contact flow to output directory
     * @param {ContactFlow} contactFlow - Contact flow object
     * @param {string} dir - Target directory
     */
    protected writeContactFlow(contactFlow: ContactFlow, dir: string) {
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        // Build file path
        const filePath = path.join(dir, `${contactFlow.Name}.json`);

        // Stringify content
        const content = contactFlow.Content;

        // Write file
        fs.writeFileSync(filePath, content);
        logger.info(`writeContactFlow: Wrote ${filePath} successfully`);
    }

    /**
     * Handles replacing values in contact flows
     * @param {ContactFlow[]} contactFlows - Array of contact flows
     * @param {object} connectObject - Mapping object
     */
    public async handleReplacements(
        contactFlows: ContactFlow[],
        accountId: string,
        region: string,
        instanceId: string,
        stage: string,
        invObject: Map<string, string>,
        outDir: string,
    ) {
        try {
            for (const flow of contactFlows) {
                logger.info(
                    `handleContactFlowReplacements: Starting ${flow.Name}`,
                );

                const engine = new ReplacementEngine();
                engine
                    .setNext(this._capabilityReplacer)
                    .setNext(new FunctionObjectMapsReplacer())
                    .setNext(new placeholderReplacer());

                const replaceResult = await engine.replace(
                    flow.Content, // The content of the contact flow is stringified
                    accountId,
                    region,
                    instanceId,
                    stage,
                    invObject,
                );
                // * This block is calling the cleanMetadata method to remove any extraneous keys from the metadata section of contact flow content.
                const cleanedJson = engine.cleanMetadata(
                    JSON.parse(replaceResult),
                );
                logger.debug(
                    `handleContactFlowReplacements:cleaned ${flow.Name}`,
                    cleanedJson,
                );

                flow.Content = JSON.stringify(cleanedJson);
                logger.info(
                    `ReplacementEngine.result: completed replacements for ${flow.Name}`,
                );
                // // * This block validates that referenced flow var values are in flow vars of flow
                // engine.validateFlowVars(flow, invObject);
                // * This block updates the flows
                this.writeContactFlow(flow, outDir);
            }
        } catch (error) {
            logger.error(
                "Managers.handleContactFlowReplacements: Error updating contact flows",
                error as Error,
            );
            throw error;
        }
    }
}
