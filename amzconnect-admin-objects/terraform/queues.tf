locals {
  queuepath = "../../imports/resources/queues"
  queues    = fileset(local.queuepath, "**")
  allqs     = { for queue in local.queues : trimsuffix(queue, ".json") => jsondecode(file("${local.queuepath}/${queue}")) }

  # If queues already exist (i.e. the development instance where the queues were created) the below code can be uncommented and import the queues, but 
  # must exist for the code to work. The data object will throw an error if the queues do not exist.
  #   q_names   = [for k, v in local.allqs : v.Name]
  #   q_imports = {
  #     for k, v in data.aws_connect_queue.queues : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.queue_id}"
  #   }

}
################################################################################
# Queue Imports
################################################################################
## This code determines what queues are currently installed on the Amazon Connect instance

# data "aws_connect_queue" "queues" {
#   for_each    = toset(local.q_names)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# output "queues_import_data" {
#   value = local.q_imports
# }

# import {
#   for_each = local.q_imports
#   to       = aws_connect_queue.this[each.key]
#   id       = each.value
# }
#


################################################################################
# Queue
################################################################################
resource "aws_connect_queue" "this" {
  for_each = local.allqs

  # required
  hours_of_operation_id = try(aws_connect_hours_of_operation.this[each.value.HoursOfOperationId].hours_of_operation_id, null)
  instance_id           = local.instance_id
  name                  = each.key

  # optional
  description  = try(each.value.Description, null)
  max_contacts = try(each.value.MaxContacts, null)

  dynamic "outbound_caller_config" {
    for_each = contains(keys(each.value), "OutboundCallerConfig") ? [1] : []

    content {
      outbound_caller_id_name      = try(each.value.OutboundCallerConfig.OutboundCallerIdName, null)
      outbound_caller_id_number_id = try(lookup(data.external.aws_cli_list_phone_numbers.result, each.value.OutboundCallerConfig.OutboundCallerIdNumberId.env[var.env], null), null)
      outbound_flow_id             = try(lookup(data.external.aws_cli_list_contact_flows.result, each.value.OutboundCallerConfig.OutboundFlowId, null), null)
    }
  }

  quick_connect_ids = var.qc_option ? [for key in each.value.QuickConnects : lookup(local.qc_map, key, null)] : []
  status            = try(each.value.Status, null)

  #   # tags
  #   tags = merge(
  #     { Name = each.key },
  #     var.tags,
  #     var.queue_tags,
  #     try(each.value.tags, {})
  #  )
  #
}

data "aws_connect_queue" "basicqueue" {
  instance_id = local.instance_id
  name        = "BasicQueue"
}

# data "aws_connect_contact_flow" "default_outbound" {
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = "Default outbound"
# }





