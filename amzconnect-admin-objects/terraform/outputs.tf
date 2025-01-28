output "aws_cli_list_phone_numbers_result" {
  description = "map of phone numbers attached to instance"
  value       = data.external.aws_cli_list_phone_numbers.result
}

output "aws_cli_list_contact_flows_result" {
  description = "map of contact flows installed in instance"
  value       = data.external.aws_cli_list_contact_flows.result
}

