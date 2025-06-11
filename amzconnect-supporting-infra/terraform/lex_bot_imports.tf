##
## This file is only used to import lex bots, if necessary. It will be a no op (unused) during normal
## operations
##
##

locals {
  lex_bots_import_alias_data = {
    for k, v in data.external.aws_cli_get_bot_prod_alias : k => v.result
  }

  # Create the ARNs for each bot and its PROD alias
  lex_bot_alias_arns = {
    for bot_name, alias_data in data.external.aws_cli_get_bot_prod_alias : bot_name => {
      for alias_id, version in alias_data.result :
      alias_id => "arn:aws:lex:${var.region}:${data.aws_caller_identity.current.account_id}:bot-alias/${data.awscc_lex_bot.lex_bot[bot_name].id}/${alias_id}"
      if alias_id != "NO_PROD_ID"
    }
  }

  # Flattened version (just bot_name => single ARN)
  flattened_lex_bot_alias_arns = {
    for bot_name, arns in local.lex_bot_alias_arns :
    bot_name => values(arns)[0]
    if length(arns) > 0
  }

  # Filter bot_state_dir_names to only include bots that exist in AWS
  existing_bots = toset([
    for name in local.bot_state_dir_names :
    name
    if lookup(data.external.aws_cli_list_lex_bots.result, name, null) != null
  ])
}

## This code determines what lex bots are currently installed in the account and maps names to ids
data "external" "aws_cli_list_lex_bots" {
  program = ["bash", "-c", "aws lexv2-models list-bots --region ${var.region} --max-results 999 | jq 'reduce .botSummaries[] as $item ({}; .[$item.botName] = $item.botId)'"]
}

## This code maps the data above to what is in the imports/resources/bots directory
data "awscc_lex_bot" "lex_bot" {
  for_each = local.existing_bots
  id       = try(lookup(data.external.aws_cli_list_lex_bots.result, each.value, null), null)
}

# Get PROD aliases for each bot in data.awscc_lex_bot.lex_bot
data "external" "aws_cli_get_bot_prod_alias" {
  for_each = data.awscc_lex_bot.lex_bot

  # Call AWS CLI to get the PROD alias for this specific bot ID
  # Default to NO_PROD_ID if no PROD alias exists
  program = ["bash", "-c", "aws lexv2-models list-bot-aliases --region ${var.region} --bot-id ${each.value.id} | jq '.botAliasSummaries[] | select(.botAliasName==\"current\") | {(.botAliasId): .botVersion} // {\"NO_PROD_ID\": \"NONE\"}'"]
}

## import lex bot
import {
  for_each = local.existing_bots
  to       = module.lex_bots[each.key].awscc_lex_bot.this
  id       = data.external.aws_cli_list_lex_bots.result[each.value]
}

## import lex bot version
import {
  for_each = local.existing_bots
  to       = module.lex_bots[each.key].aws_lexv2models_bot_version.lexbot_version
  id       = "${data.external.aws_cli_list_lex_bots.result[each.value]},${values(local.lex_bots_import_alias_data[each.value])[0]}"
}

## import lex bot alias
import {
  for_each = local.existing_bots
  to       = module.lex_bots[each.key].awscc_lex_bot_alias.lexbot_alias
  id       = "${keys(local.lex_bots_import_alias_data[each.value])[0]}|${data.external.aws_cli_list_lex_bots.result[each.value]}"
}

# import lex bot integration association
import {
  for_each = local.existing_bots
  to       = module.lex_bots[each.key].awscc_connect_integration_association.this
  id       = "${local.instance_arn}|LEX_BOT|${local.flattened_lex_bot_alias_arns[each.value]}"
}



