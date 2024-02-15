locals {
  region_shortnames = {
    us-east-1 = "use1"
    us-west-2 = "usw2"
  }
  ssm_prefix = "/${var.env}/${local.region_shortnames[var.region]}"
}
