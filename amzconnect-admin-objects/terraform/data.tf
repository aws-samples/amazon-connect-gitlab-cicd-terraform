data "aws_ssm_parameter" "amz-connect-instance-id" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}/amz-connect-instance-id"
}

data "aws_caller_identity" "current" {}

data "external" "aws_cli_list_contact_flows" {
  program = ["bash", "-c", "aws connect list-contact-flows --instance-id ${local.instance_id} --region ${var.region} --contact-flow-types OUTBOUND_WHISPER QUEUE_TRANSFER | jq 'reduce .ContactFlowSummaryList[] as $item ({}; .[$item.Name] = $item.Id)'"]
  depends_on = [
    aws_connect_contact_flow.queue_transfer_flows,
    aws_connect_contact_flow.outbound_whisper_flows
  ]
}

data "external" "aws_cli_list_phone_numbers" {
  program = ["bash", "-c", "aws connect list-phone-numbers-v2 | jq 'reduce .ListPhoneNumbersSummaryList[] as $item ({}; .[$item.PhoneNumber] = $item.PhoneNumberId)'"]
}

