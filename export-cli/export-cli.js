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
    console.log('*  © 2025 Amazon Web Services, Inc. or its affiliates. All Rights       *');
    console.log('*  Reserved. This work is licensed under a Creative Commons Attribution *');
    console.log('*  4.0 International License.                                           *');
    console.log('*                                                                       *');
    console.log('*         AWS Contact Center as a Service (CCaaS) Export Utility        *');
    console.log('*                                                                       *');
    console.log('*  This utility walks you through the process of exporting Amazon       *');
    console.log('*  Connect and Amazon Lex application resources incuding:               *');
    console.log('*                                                                       *');
    console.log('*  - Hours of operation (HOOP)        - Bots                            *');
    console.log('*  - Queues                           - Bot versions & aliases          *');
    console.log('*  - Contact flow modules             - Intents                         *');
    console.log('*  - Contact flows                    - Slot types                      *');
    console.log('*  - Routing profiles                 - Slots                           *');
    console.log('*  - Security profiles                                                  *');
    console.log('*  - Agent statuses                                                     *');
    console.log('*  - Quick connects                                                     *');
    console.log('*                                                                       *');
    console.log('*************************************************************************');
    console.log();

    // Use CLI args if provided, otherwise prompt
    let region = cliArgs.region;
    let instanceId = cliArgs.instanceId;
    let option = cliArgs.option;

    // Fallback to interactive prompt if args not provided
    if (!region) {
        region = prompt('> Enter target AWS region (us-east-1): ') || 'us-east-1';
        console.log();
    }

    // If option not provided via CLI, prompt for it
    if (!option) {
        do {
            console.log('> Select an export option from the following list:');
            console.log();
            console.log('   1) Amazon Connect resources only');
            console.log('   2) Amazon Lex resources only');
            console.log('   3) Amazon Connect and Lex (default)');
            console.log();
            option = prompt('  Enter selection (1-3): ') || '3';
        } while(!['', '1', '2', '3'].includes(option));
    }

    const doConnectExport = option === '' || option === '1' || option === '3';
    const doLexExport = option === '2' || option === '3';

    if (doConnectExport && !instanceId) {
        instanceId = requireResponse('Amazon Connect instance ID: ');
    }
    
    const edir = path.join(__dirname, '..', 'exports');
    const dir = path.join(__dirname, '..', 'exports', 'resources');
    mkdir(edir);
    mkdir(dir);
    console.log(`See path = [${dir}] for output.`);

    if (doConnectExport) {
        const cx = new CxExporter(instanceId, region, dir);
        await cx.exportConnect();
        console.log();
    }

    if (doLexExport) {
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
    console.log('  node export-cli.js --region <aws-region> --instanceId <connect-instance-id> --option <1|2|3>');
    console.log('\nOptions:');
    console.log('  --region     AWS region (e.g., us-east-1)');
    console.log('  --instanceId Amazon Connect instance ID');
    console.log('  --option     Export option (1=Connect only, 2=Lex only, 3=Both)');
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
