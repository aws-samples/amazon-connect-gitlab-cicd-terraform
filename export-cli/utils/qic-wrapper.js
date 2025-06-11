const {
    QConnectClient,
    ListAssistantsCommand
} = require('@aws-sdk/client-qconnect');


class QiCWrapper {

    #qic;

    constructor(region) {
        this.#qic = new QConnectClient({ region, maxAttempts: 25 });
    }

    async listAssistants() {

        let nextToken;
        const list = [];

        do {
            // prepare request and send it
            const req = new ListAssistantsCommand();
            const resp = await this.#qic.send(req);

            // check response
            const metadata = resp ? resp['$metadata'] : null;
            if (!metadata || metadata.httpStatusCode !== 200) {
                console.error(`List command failed. Status = [${metadata?.httpStatusCode}].`);
                throw new Error('No response from AWS');
            }

            // extract resource summary list
            const data = resp['assistantSummaries'] || [];
            if (!resp?.nextToken && (!Array.isArray(data) || data.length < 1)) break;

            list.push(...data);
            nextToken = resp.nextToken;

        } while (nextToken);

        const map = new Map();
        if (!list) return map;

        for (const s of list) {
            if (!s?.name || !s.assistantId) continue;
            map.set(s.assistantId, s.name);
        }
        return map;
    }



} // class

module.exports = QiCWrapper;