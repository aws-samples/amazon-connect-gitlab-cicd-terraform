data "aws_ssm_parameter" "amz-connect-instance-id" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}/amz-connect-instance-id"
}

data "aws_caller_identity" "current" {}