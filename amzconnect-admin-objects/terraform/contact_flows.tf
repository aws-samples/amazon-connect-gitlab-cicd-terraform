locals {
  queue_transfer_flows   = ["acme_queue_transfer_AUTO"]
  outbound_whisper_flows = ["acme_outbound_flow1_AUTO", "acme_outbound_flow2_AUTO"]
  template_path          = "${path.module}/../../amzconnect-contact-flows/templates"
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

