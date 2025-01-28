import {
    QConnectClient,
    ListAssistantsCommand,
    AssistantSummary,
} from "@aws-sdk/client-qconnect";
import { Logger } from "@aws-lambda-powertools/logger";
import { getQiCClient } from "./aws";

const region = process.env.AWS_REGION;
const logger = new Logger({ serviceName: "provisioner" });

/**
 * Class for managing Lex bots.
 */
export class QiCManager {
    private client: QConnectClient;

    constructor() {
        this.client = getQiCClient(region);
    }

    /**
     * Lists all QiC assistants in the account.
     * @returns {AssistantSummary[]} An array of assistant summaries.
     */

    public async listAssistants(): Promise<AssistantSummary[]> {
        try {
            let nextToken;
            const list = [];

            do {
                // prepare request and send it
                const req = new ListAssistantsCommand();
                const resp = await this.client.send(req);

                // check response
                const metadata = resp ? resp["$metadata"] : null;
                if (!metadata || metadata.httpStatusCode !== 200) {
                    console.error(
                        `List command failed. Status = [${metadata?.httpStatusCode}].`,
                    );
                    throw new Error("No response from AWS");
                }

                // extract resource summary list
                const data = resp["assistantSummaries"] || [];
                if (
                    !resp?.nextToken &&
                    (!Array.isArray(data) || data.length < 1)
                )
                    break;

                list.push(...data);
                nextToken = resp.nextToken;
            } while (nextToken);
            logger.info(
                "QiCManager.listAssistants: Found " +
                    list.length +
                    " QiC assistants",
            );
            return list;
        } catch (error) {
            logger.error(
                "QiCManager.listAssistants: Error listing assistants",
                error as Error,
            );
            throw error;
        }
    }
}
