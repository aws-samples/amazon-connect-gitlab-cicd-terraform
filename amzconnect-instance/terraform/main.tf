data "aws_caller_identity" "current" {}

module "amazon_connect" {
  source = "git::https://github.com/aws-ia/terraform-aws-amazonconnect.git?ref=1c714db279cef6e9105a806927aa08dd0539a8e1"
  # version = ">= 0.0.1"

  # Instance
  instance_alias                     = join("-", [var.ivr_id, var.env, local.region_shortnames[var.region], var.instance_alias, data.aws_caller_identity.current.account_id])
  instance_identity_management_type  = "CONNECT_MANAGED"
  instance_inbound_calls_enabled     = true
  instance_outbound_calls_enabled    = true
  instance_contact_flow_logs_enabled = true

  # Instance Storage Configuration
  instance_storage_configs = local.instance_storage_configs

  # Tags
  tags = {
    foo = "bar"
  }
}

resource "aws_ssm_parameter" "this" {
  # SSM Parameters aren't sensitive
  # checkov:skip=CKV_AWS_337: "Ensure SSM parameters are using KMS CMK"
  # checkov:skip=CKV2_AWS_34: "AWS SSM Parameter should be Encrypted"
  name  = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}/amz-connect-instance-id"
  type  = "String"
  value = module.amazon_connect.instance_id
}
