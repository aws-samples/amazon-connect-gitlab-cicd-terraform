locals {
  region_shortnames = {
    us-east-1 = "use1"
    us-west-2 = "usw2"
  }
  instance_id = nonsensitive(data.aws_ssm_parameter.amzconnect-instance-id.value)
}
