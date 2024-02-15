locals {
  region_shortnames = {
    us-east-1 = "use1"
    us-west-2 = "usw2"
  }
  instance_id    = nonsensitive(data.aws_ssm_parameter.amzconnect-instance-id.value)
  ivr_ssm_prefix = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}"
  ssm_prefix     = "/${var.env}/${local.region_shortnames[var.region]}"
}
