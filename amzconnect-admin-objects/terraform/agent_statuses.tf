locals {
  agent_statuspath = "../../imports/resources/agent-statuses"
  agent_statuses   = fileset(local.agent_statuspath, "**")
  allas            = { for agent_status in local.agent_statuses : trimsuffix(agent_status, ".json") => jsondecode(file("${local.agent_statuspath}/${agent_status}")) }

  # If agent_statuses already exist (i.e. Dev) the below code can be uncommented and import the agent_statuses, but 
  # must exist for the code to work. The data object will throw an error if the agent_statuses do not exist.
  #   as_names         = [for k, v in local.allas : v.Name]
  #   as_imports = {
  #     for k, v in data.aws_connect_agent_status.agent_statuses : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.agent_status_id}"
  #   }

}
################################################################################
# Agent Status Imports
################################################################################
## This code determines what agent_statuses are currently installed on the Amazon Connect instance

# data "aws_connect_agent_status" "agent_statuses" {
#   for_each    = toset(local.as_names)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# output "agent_statuses_import_data" {
#   value = local.as_imports
# }

# import {
#   for_each = local.as_imports
#   to       = aws_connect_agent_status.this[each.key]
#   id       = each.value
# }
#


################################################################################
# Agent Statuses
################################################################################
resource "awscc_connect_agent_status" "this" {
  for_each = local.allas

  # required
  instance_arn = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${local.instance_id}"
  name         = each.value.Name
  state        = each.value.State

  # optional
  description = try(each.value.Description, null)
  type        = try(each.value.Type, null)

  #   # tags
  #   tags = merge(
  #     { Name = each.key },
  #     var.tags,
  #     var.agent_status_tags,
  #     try(each.value.tags, {})
  #  )
  #
}

