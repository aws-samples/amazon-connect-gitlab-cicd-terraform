resource "aws_lambda_layer_version" "aws_layer" {
  filename   = data.archive_file.layer_source.output_path
  layer_name = "connect-workshop-layer"

  compatible_runtimes = ["nodejs18.x"]
}

module "lambda_provisioner_function" {
  # checkov:skip=CKV_AWS_258 Ensure that Lambda function URLs AuthType is not None
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-lambda.git?ref=c173c27fb57969da85967f2896b858c4654b0bba"

  function_name = "${var.env}_${local.region_shortnames[var.region]}_callflow_provisioner_workshop2"
  description   = "${var.env}_${local.region_shortnames[var.region]}_callflow_provisioner_workshop2"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  memory_size   = 1024
  timeout       = 900
  layers        = ["${aws_lambda_layer_version.aws_layer.arn}"]
  environment_variables = {
    FUNCTION_ENV     = var.env
    FUNCTION_ACCOUNT = data.aws_caller_identity.current.account_id
    BUCKET           = data.aws_ssm_parameter.bucket.value
    LOG_LEVEL        = "INFO"
  }
  create_package           = false
  local_existing_package   = data.archive_file.source.output_path
  attach_policy_statements = true
  policy_statements = {
    connectPolicies = {
      effect = "Allow",
      actions : [
        "connect:Associate*",
        "connect:CreateContactFlow",
        "connect:CreateContactFlowModule",
        "connect:DeleteContactFlow",
        "connect:DeleteContactFlowmodule",
        "connect:Describe*",
        "connect:DisassociateBot",
        "connect:Get*",
        "connect:List*",
        "connect:UpdateContactFlowContent",
        "connect:UpdateContactFlowName",
        "connect:UpdateContactFlowMetadata",
        "connect:UpdateContactFlowModuleContent",
        "connect:UpdateContactFlowModulemetadata",
        "connect:UpdateContactFlowContent",
        "connect:UpdateInstanceStorageConfig",
        "connect:UpdateQueueName",
        "connect:TagResource"
      ],
      resources : [
        "*"
      ]
    },
    ssmPolicies = {
      effect = "Allow",
      actions : [
        "ssm:GetParameter",
      ],
      resources : ["arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/*"]
    },
    s3Policies = {
      effect = "Allow",
      actions : [
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:Get*",
        "s3:List*",
        "s3:Put*"
      ],
      resources : [
        "arn:aws:s3:::${data.aws_ssm_parameter.bucket.value}",
        "arn:aws:s3:::${data.aws_ssm_parameter.bucket.value}/*"
      ]
    },
    lexPolicies = {
      effect = "Allow",
      actions : [
        "lex:DescribeBotAlias",
        "lex:CreateResourcePolicy",
        "lex:UpdateResourcePolicy",
        "lex:List*",
      ],
      resources : ["arn:aws:lex:*:${data.aws_caller_identity.current.account_id}:*"]
    },
    lambdaPolicies = {
      effect = "Allow",
      actions : ["lambda:AddPermission", "lambda:UpdateFunctionCode"],
      resources : ["arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function:*"]
    },
    lambdaListPolicies = {
      effect = "Allow",
      actions : ["lambda:List*"],
      resources : ["*"]
    },
    xrayPolicies = {
      effect = "Allow",
      actions : [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "xray:GetSamplingStatisticSummaries",
      ],
      resources : ["*"]
    }
  }
}

module "lambda_function" {
  # checkov:skip=CKV_AWS_258 Ensure that Lambda function URLs AuthType is not None
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-lambda.git?ref=c173c27fb57969da85967f2896b858c4654b0bba"

  function_name = "${var.capability_id}-exampleFunction2"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  # Note: By default this module will create a role with the same name of the function. We want to keep the function name the same
  # across regions for usage within contact flow, however roles are global, so we are adding the region name to end of role.
  role_name = "${var.capability_id}-exampleFunction2-${local.region_shortnames[var.region]}"

  create_package         = false
  local_existing_package = "${path.module}/exampleFunction.zip"

  attach_policy_statements = true
  policy_statements = {
    xrayPolicies = {
      effect = "Allow",
      actions : [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "xray:GetSamplingStatisticSummaries",
      ],
      resources : ["*"]
    }
  }
}

resource "aws_ssm_parameter" "provisioner_arn" {
  # SSM Parameters aren't sensitive
  # checkov:skip=CKV_AWS_337: "Ensure SSM parameters are using KMS CMK"
  # checkov:skip=CKV2_AWS_34: "AWS SSM Parameter should be Encrypted"
  name  = "${local.ssm_prefix}/ProvisionerFunctionArn"
  type  = "String"
  value = module.lambda_provisioner_function.lambda_function_arn
}

resource "awscc_connect_integration_association" "this" {
  instance_id      = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${nonsensitive(data.aws_ssm_parameter.amzconnect-instance-id.value)}"
  integration_arn  = module.lambda_function.lambda_function_arn
  integration_type = "LAMBDA_FUNCTION"
}

output "instance_arn" {
  value = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${nonsensitive(data.aws_ssm_parameter.amzconnect-instance-id.value)}"
}

