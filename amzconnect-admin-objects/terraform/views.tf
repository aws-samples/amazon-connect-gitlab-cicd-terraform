locals {
  viewspath    = "../../imports/resources/views"
  views_files  = fileset(local.viewspath, "**")
  allviews     = { for view in local.views_files : trimsuffix(view, ".json") => jsondecode(file("${local.viewspath}/${view}")) }
  instance_arn = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${local.instance_id}"
  # If views already exist (i.e. on development instance where they were created)
  # Uncomment the following to import existing views
  # 
  # view_names = [for k, v in local.allviews : v.Name]
  # view_imports = {
  #   for k, v in data.awscc_connect_view.views : k => "\${v.id}"
  # }
}

################################################################################
# View Imports
################################################################################
## This code determines what views are currently installed on the Amazon Connect instance
## Uncomment if you need to import resources provisioned outside of terraform

# data "awscc_connect_view" "views" {
#   for_each    = toset(local.view_names)
#   instance_arn = local.instance_arn
#   name        = each.value
# }
#
# output "view_import_data" {
#   value = local.view_imports
# }
#
# import {
#   for_each = local.view_imports
#   to       = awscc_connect_view.this[each.key]
#   id       = each.value
# }

################################################################################
# Views
################################################################################
resource "awscc_connect_view" "this" {
  for_each = local.allviews

  # required
  instance_arn = local.instance_arn
  name         = each.key
  actions      = try(each.value.Content.Actions, [])
  template     = try(each.value.Content.Template, null)

  # optional
  description = try(each.value.Description, null)

  # tags
  #   dynamic "tags" {
  #     for_each = try(each.value.Tags, {}) != {} ? [1] : []
  #     content {
  #       for_each = try(each.value.Tags, {})
  #       key      = tags.key
  #       value    = tags.value
  #     }
  #   }
}

# # Output the created views
# output "connect_views" {
#   description = "map of deployed views"
#   value = {
#     for k, v in awscc_connect_view.this : k => {
#       name     = v.name
#       view_arn = v.view_arn
#       id       = v.id
#     }
#   }
# }