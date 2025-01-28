# Note: Quick Connects have a dependency upon needing a queue transfer flow which doesn't exist yet as contact flows 
# are the last pipeline to run so we need to create a simple one to deploy in advance.

locals {
  qcpath = "../../imports/resources/quick-connects"
  qcs    = fileset(local.qcpath, "**")
  allqcs = { for qc in local.qcs : trimsuffix(qc, ".json") => jsondecode(file("${local.qcpath}/${qc}")) }


  # If quick connects already exist (i.e. the development instance where the quick connects were created) the below code can be uncommented and import the quick connects, but 
  # must exist for the code to work. The data object will throw an error if the quick connects do not exist.

  qc_names = [for k, v in local.allqcs : v.Name]
  #   qc_imports = {
  #     for k, v in data.aws_connect_quick_connect.qcs : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.quick_connect_id}"
  #   }
  qc_map = var.qc_option == true ? {
    for k, v in data.aws_connect_quick_connect.qcs : k => v.quick_connect_id
  } : {}

}


################################################################################
# Quick Connect Imports
################################################################################
## This code determines what quick connects are currently installed on the Amazon Connect instance

data "aws_connect_quick_connect" "qcs" {
  for_each    = var.qc_option ? toset(local.qc_names) : []
  instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
  name        = each.value
}

# output "contact_qcs_import_data" {
#   value = local.qc_imports
# }

# import {
#   for_each = local.qc_imports
#   to       = aws_connect_quick_connect.this[each.key]
#   id       = each.value
# }

################################################################################
# Quick Connect
################################################################################
resource "aws_connect_quick_connect" "this" {
  for_each = local.allqcs

  # required
  instance_id = local.instance_id
  name        = each.key

  quick_connect_config {
    quick_connect_type = each.value.Type

    # optional
    dynamic "phone_config" {
      for_each = strcontains(each.value.Type, "PHONE_NUMBER") ? [1] : []

      content {
        phone_number = each.value.Number
      }
    }

    dynamic "queue_config" {
      for_each = strcontains(each.value.Type, "QUEUE") ? [1] : []

      content {
        contact_flow_id = try(aws_connect_contact_flow.queue_transfer_flows[each.value.Flow].contact_flow_id, null)
        queue_id        = try(aws_connect_queue.this[each.value.Queue].queue_id, null)
      }
    }

  }

  # optional
  description = try(each.value.description, null)

  #   # tags
  #   tags = merge(
  #     { Name = each.key },
  #     var.tags,
  #     var.quick_connect_tags,
  #     try(each.value.tags, {})
  #   )
}

