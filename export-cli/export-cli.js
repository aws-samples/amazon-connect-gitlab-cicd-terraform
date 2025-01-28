const prompt = require('prompt-sync')();
const path = require('path');
const CxExporter = require('./utils/cx-exporter');
const NluExporter = require('./utils/nlu-exporter');
const { mkdir } = require('./utils/io-util');

// Add command line argument parsing
const parseArgs = () => {
    const args = {};
    const argv = process.argv.slice(2); // Remove first two default arguments

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const value = argv[i + 1];
            if (value && !value.startsWith('--')) {
                args[key] = value;
                i++; // Skip the next argument since it's the value
            } else {
                args[key] = true;
            }
        }
    }

    return args;
};

const main = async () => {
    // Parse command line arguments
    const cliArgs = parseArgs();

    console.log('*************************************************************************');
    console.log('*                                                                       *');
    console.log('*  © 2024 Amazon Web Services, Inc. or its affiliates. All Rights       *');
    console.log('*  Reserved. This work is licensed under a Creative Commons Attribution *');
    console.log('*  4.0 International License.                                           *');
    console.log('*                                                                       *');
    console.log('*         AWS Contact Center as a Service (CCaaS) Export Utility        *');
    console.log('*                                                                       *');
    console.log('*  This utility walks you through the process of exporting Amazon       *');
    console.log('*  Connect and Amazon Lex application resources incuding:               *');
    console.log('*                                                                       *');
    console.log('*  - Hours of operation (HOOP)                                          *');
    console.log('*  - Queues                                                             *');
    console.log('*  - Contact flow modules                                               *');
    console.log('*  - Contact flows                                                      *');
    console.log('*  - Routing profiles                                                   *');
    console.log('*  - Security profiles                                                  *');
    console.log('*  - Agent statuses                                                     *');
    console.log('*  - Quick connects                                                     *');
    console.log('*                                                                       *');
    console.log('*************************************************************************');
    console.log();

    // Use CLI args if provided, otherwise prompt
    let region = cliArgs.region;
    let instanceId = cliArgs.instanceId;

    // Fallback to interactive prompt if args not provided
    if (!region) {
        region = prompt('> Enter target AWS region (us-east-1): ') || 'us-east-1';
        console.log();
    }

    const option = '1'; // Keeping your default option

    const doConnectExport = option === '' || option === '1' || option === '3';

    if (doConnectExport && !instanceId) {
        instanceId = requireResponse('Amazon Connect instance ID: ');
    }
    const edir = path.join(__dirname, '..', 'exports')
    const dir = path.join(__dirname, '..', 'exports', 'resources');
    mkdir(edir)
    mkdir(dir);
    console.log(`See path = [${dir}] for output.`);

    if (doConnectExport) {
        const cx = new CxExporter(instanceId, region, dir);
        await cx.exportConnect();
        console.log();
    }

    if (option === '2' || option === '3') {
        const nlu = new NluExporter(region, dir);
        await nlu.exportResources();
        console.log();
    }
}

const requireResponse = (message) => {
    let response;
    do {
        response = prompt(`> ${message}`);
    } while (!response);
    return response;
}

// Add help message function
const showHelp = () => {
    console.log('Usage:');
    console.log('  node script.js --region <aws-region> --instanceId <connect-instance-id>');
    console.log('\nOptions:');
    console.log('  --region     AWS region (e.g., us-east-1)');
    console.log('  --instanceId Amazon Connect instance ID');
    console.log('  --help       Show this help message\n');
};

// Check for help flag
if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
}

module.exports = { main };

main().then(() => {
    //console.log('Export done!');
}).catch((error) => {
    console.error(error);
});