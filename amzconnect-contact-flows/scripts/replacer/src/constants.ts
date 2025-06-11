import placeholders from "./placeholders.json";

export const DEFAULT_STAGE = "dev";
export const FLOWS = "flows";
export const HOOP = "hoop";
export const QUEUES = "queues";
export const MODULES = "modules";
export const QUICK_CONNECTS = "quick-connects";
export const ROUTING_PROFILES = "routing-profiles";
export const SECURITY_PROFILES = "security-profiles";
export const AGENT_STATUSES = "agent-statuses";
export const BOTS = "bots";

export const ATTR_TYPES = [
    "INBOUND_CALLS",
    "OUTBOUND_CALLS",
    "AUTO_RESOLVE_BEST_VOICES",
    "EARLY_MEDIA",
    "MULTI_PARTY_CONFERENCE",
    "CONTACTFLOW_LOGS",
];

export const STORAGE_RESOURCE_TYPES = [
    "CALL_RECORDINGS",
    "CHAT_TRANSCRIPTS",
    "SCHEDULED_REPORTS",
    "CONTACT_TRACE_RECORDS",
    "AGENT_EVENTS",
];

export const APPLICATION_RESOURCES = [
    FLOWS,
    HOOP,
    QUEUES,
    MODULES,
    QUICK_CONNECTS,
    ROUTING_PROFILES,
    SECURITY_PROFILES,
    AGENT_STATUSES,
    BOTS,
];

export const PROVISIONED = "PROVISIONED";
export const ON_DEMAND = "ON_DEMAND";
export const STREAM_MODES = [PROVISIONED, ON_DEMAND];

export const CALL_RECORDINGS = "CallRecordings";
export const CHAT_TRANSCRIPTS = "ChatTranscripts";
export const REPORTS = "Reports";
export const AGENT_EVENTS = "AE";
export const CONTACT_TRACE_RECORDS = "CTR";

// CFN OUTPUT NAMES
export const CFN_REL_BUCKET_NAME = "ReleaseBucket";
export const CFN_REL_NUMBER = "release-no";
export const CFN_INSTANCE_ARN = "instance-arn";
export const CFN_INSTANCE_ID = "instance-id";
export const CFN_INSTANCE_ALIAS = "instance-alias";
export const CFN_ENCRYPTION_KEY_ARN = "key-arn";
export const CFN_CCP_URL = "ccp-url";
export const CFN_NLU_STREAM_ARN = "NluStreamArn";

// Resource name placeholders
export const ACCOUNT_TOKEN = "{ACCOUNT}";
export const APP_NAME_TOKEN = "{APP_NAME}";
export const LOB_NAME_TOKEN = "{LOB_NAME}";
export const STACK_TOKEN = "{STACK_NAME}";
export const ID_TOKEN = "{ID}";
export const REGION_TOKEN = "{REGION}";
export const STAGE_TOKEN = "{STAGE}";
export const ALIAS_TOKEN = "{ALIAS}";

// SSM PARAMETER NAMES
export const SSM_PREFIX = `/${STAGE_TOKEN}/${APP_NAME_TOKEN}`;
export const SSM_LAST_UPDATE = `/${STAGE_TOKEN}/${APP_NAME_TOKEN}/updated`;
export const SSM_RELEASE = "release";

// Amazon Connect resource reference placeholders
export const ACCOUNT = placeholders.ACCOUNT;
export const REGION = placeholders.REGION;
export const INSTANCE = placeholders.INSTANCE;
export const STAGE = placeholders.STAGE;
export const FLOW_PREFIX = placeholders.FLOW_PREFIX;
export const FLOW_SUFFIX = placeholders.FLOW_SUFFIX;
export const MODULE_PREFIX = placeholders.MODULE_PREFIX;
export const MODULE_SUFFIX = placeholders.MODULE_SUFFIX;
export const QUEUE_PREFIX = placeholders.QUEUE_PREFIX;
export const QUEUE_SUFFIX = placeholders.QUEUE_SUFFIX;
export const PROMPT_PREFIX = placeholders.PROMPT_PREFIX;
export const PROMPT_SUFFIX = placeholders.PROMPT_SUFFIX;

export const DUMMY_DESCRIPTION = "WARNING: PLACEHOLDER!";
export const NOT_FOUND = "NOT_FOUND";
export const RELEASE_FILE = "release.json";
export const PHONE_MAP_FILE = "phoneNumbers.json";
