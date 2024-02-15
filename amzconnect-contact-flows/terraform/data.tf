data "aws_ssm_parameter" "amzconnect-instance-id" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}/amz-connect-instance-id"
}

data "aws_ssm_parameter" "bucket" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/deploy-assets-bucket"
}

data "aws_ssm_parameter" "provisioner_arn" {
  name = "${local.ssm_prefix}/ProvisionerFunctionArn"
  #   name  = "${local.ssm_prefix}/WorkshopProvisionerFunctionArn"
}

data "aws_caller_identity" "current" {}

