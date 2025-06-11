output "lex_bots_import_data" {
  description = "Lex bot import data"
  value       = data.awscc_lex_bot.lex_bot
}

output "flattened_lex_bot_alias_arns" {
  description = "Flattened list of lex bot alias arns"
  value       = local.flattened_lex_bot_alias_arns
}

output "existing_bots" {
  description = "list of bots already in AWS"
  value       = local.existing_bots
}

output "get_lambda_codehooks_by_locale" {
  description = "lambda_codehooks_by_locale"
  value       = local.get_lambda_codehooks_by_locale
}




