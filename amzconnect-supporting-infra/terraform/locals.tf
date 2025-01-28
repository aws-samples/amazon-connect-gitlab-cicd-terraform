locals {
  region_shortnames = {
    us-east-1 = "use1"
    us-west-2 = "usw2"
  }
  base_name     = "${var.env}-${local.region_shortnames[var.region]}-lex-${var.lexbot_name}"
  complete_name = "${var.capability_id}-${var.lexbot_name}"
}
