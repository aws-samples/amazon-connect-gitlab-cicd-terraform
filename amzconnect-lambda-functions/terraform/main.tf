module "lambda_function" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-lambda.git?ref=c173c27fb57969da85967f2896b858c4654b0bba"

  function_name = "acme-exampleFunction-${local.region_shortnames[var.region]}"
  description   = "acme-exampleFunction"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  publish       = true

  create_package         = false
  local_existing_package = "${path.module}/build-artifacts/exampleFunction.zip"

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

resource "awscc_connect_integration_association" "this" {
  instance_id      = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${local.instance_id}"
  integration_arn  = module.lambda_function.lambda_function_arn
  integration_type = "LAMBDA_FUNCTION"
}


