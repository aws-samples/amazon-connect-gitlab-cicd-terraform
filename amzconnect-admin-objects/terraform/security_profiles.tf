locals {
  sppath = "../../imports/resources/security-profiles"
  sps    = fileset(local.sppath, "**")
  allsps = { for sp in local.sps : trimsuffix(sp, ".json") => jsondecode(file("${local.sppath}/${sp}")) }


  # If security profiles already exist (i.e. the development instance where the security profiles were created) the below code can be uncommented and import the security profiles, but 
  # must exist for the code to work. The data object will throw an error if the security profiles do not exist.

  #   sp_names = [for k, v in local.allsps : v.Name]
  #   sp_imports = {
  #     for k, v in data.aws_connect_security_profile.sps : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.security_profile_id}"
  #   }
}

################################################################################
# Routing Profile Imports
################################################################################
## This code determines what quick connects are currently installed on the Amazon Connect instance

# data "aws_connect_security_profile" "sps" {
#   for_each    = toset(local.sp_names)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# output "sp_import_data" {
#   value = local.sp_imports
# }

# import {
#   for_each = local.sp_imports
#   to       = aws_connect_security_profile.this[each.key]
#   id       = each.value
# }
#


################################################################################
# Security Profiles
################################################################################
resource "aws_connect_security_profile" "this" {
  for_each = local.allsps

  # required
  instance_id = local.instance_id
  name        = each.key

  # optional
  description = try(each.value.Description, null)
  permissions = try(each.value.Permissions, null)

  # tags
  #   tags = merge(
  #     { Name = each.key },
  #     var.tags,
  #     var.security_profile_tags,
  #     try(each.value.tags, {})
  #   )
  #
}