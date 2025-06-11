const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

class StsWrapper {

    #sts;

    constructor(region) {
        this.#sts =  new STSClient({ region, maxAttempts: 10 });
    }

    async getAccountId() {
        const data = await this.#sts.send(new GetCallerIdentityCommand());
        console.log('STSHelper.getAccountId:', data.Account);
        return data.Account;
    }

} // class

module.exports = StsWrapper;