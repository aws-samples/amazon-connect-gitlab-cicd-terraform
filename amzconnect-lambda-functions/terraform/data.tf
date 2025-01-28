data "aws_ssm_parameter" "amzconnect-instance-id" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}/amz-connect-instance-id"
}

data "aws_caller_identity" "current" {}

