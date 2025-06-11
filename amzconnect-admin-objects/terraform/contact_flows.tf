locals {
  queue_transfer_flows   = ["acme_queue_transfer_AUTO"]
  outbound_whisper_flows = ["acme_outbound_flow1_AUTO", "acme_outbound_flow2_AUTO"]
  template_path          = "${path.module}/../../amzconnect-contact-flows/templates"

  ## Import logic - uncomment if the need for importing resources provisioned outside of terraform exists
  #   queue_transfer_imports = {
  #     for k, v in data.aws_connect_contact_flow.queue_transfer_flows : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.contact_flow_id}"
  #   }
  #   outbound_whisper_imports = {
  #     for k, v in data.aws_connect_contact_flow.outbound_whisper_flows : k => "${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}:${v.contact_flow_id}"
  #   }
}

resource "aws_connect_contact_flow" "queue_transfer_flows" {
  for_each = toset(local.queue_transfer_flows)

  instance_id = local.instance_id
  name        = each.value
  type        = "QUEUE_TRANSFER"
  filename    = "${local.template_path}/disconnectParticipant.json"

  lifecycle {
    ignore_changes = [tags, description]
  }
}

resource "aws_connect_contact_flow" "outbound_whisper_flows" {
  for_each = toset(local.outbound_whisper_flows)

  instance_id = local.instance_id
  name        = each.value
  type        = "OUTBOUND_WHISPER"
  filename    = "${local.template_path}/endFlowExecution_whisper.json"

  lifecycle {
    ignore_changes = [tags, description]
  }
}


## This code determines what contact flows are currently installed on the Amazon Connect instance
## uncomment if the need for importing resources provisioned outside of terraform exists

# data "aws_connect_contact_flow" "queue_transfer_flows" {
#   for_each    = toset(local.queue_transfer_flows)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# data "aws_connect_contact_flow" "outbound_whisper_flows" {
#   for_each    = toset(local.outbound_whisper_flows)
#   instance_id = data.aws_ssm_parameter.amz-connect-instance-id.value
#   name        = each.value
# }

# import {
#   for_each = local.queue_transfer_imports
#   to       = aws_connect_contact_flow.queue_transfer_flows[each.key]
#   id       = each.value
# }

# import {
#   for_each = local.outbound_whisper_imports
#   to       = aws_connect_contact_flow.outbound_whisper_flows[each.key]
#   id       = each.value
# }

