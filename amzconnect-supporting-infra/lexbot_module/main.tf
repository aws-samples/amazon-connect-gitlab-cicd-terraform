resource "awscc_lex_bot" "this" {
  lifecycle {
    ignore_changes = [
      description
    ]
  }
  data_privacy = {
    child_directed = false
  }
  idle_session_ttl_in_seconds = var.idle_session_ttl_in_seconds
  name                        = var.lexbot_complete_name
  role_arn                    = aws_iam_role.lex_role.arn
  auto_build_bot_locales      = true
  bot_file_s3_location = {
    s3_bucket         = var.s3_bucket
    s3_object_key     = var.s3_object_key
    s3_object_version = var.s3_obj_version_id
  }
}

resource "aws_lexv2models_bot_version" "lexbot_version" {
  bot_id = awscc_lex_bot.this.id
  locale_specification = {
    for lang in local.languages :
    lang => {
      source_bot_version = "DRAFT"
    }
  }

  lifecycle {
    create_before_destroy = true
    replace_triggered_by = [
      awscc_lex_bot.this.bot_file_s3_location.s3_object_version
    ]
  }

  depends_on = [
    awscc_lex_bot.this
  ]
}

resource "awscc_lex_bot_alias" "lexbot_alias" {
  # A best practice is to use a consistent name for the alias across environments so that it can be invoked in a contact flow identically.
  bot_alias_name = var.lexbot_alias
  bot_id         = awscc_lex_bot.this.id
  bot_alias_locale_settings = [
    for lang in local.languages :
    {
      bot_alias_locale_setting = {
        enabled = true
        code_hook_specification = contains(keys(var.lambda_codehooks_by_locale), lang) ? {
          lambda_code_hook = {
            code_hook_interface_version = "1.0"
            lambda_arn                  = var.lambda_codehooks_by_locale[lang]
          }
        } : null
      }
      locale_id = lang
    }
  ]
  bot_version = aws_lexv2models_bot_version.lexbot_version.bot_version #awscc_lex_bot_version.lexbot_version.bot_version
  conversation_log_settings = {
    enabled = true
    text_log_settings = [
      {
        destination = {
          cloudwatch = {
            cloudwatch_log_group_arn = aws_cloudwatch_log_group.lexbot_log_group.arn
            log_prefix               = "/aws/lex/${awscc_lex_bot.this.name}/${var.lexbot_alias}"
          }
        }
        enabled = true
      }
    ]
    audio_log_settings = [{
      enabled = false
      destination = {
        s3_bucket = {
          s3_bucket_arn = var.audio_log_bucket
          log_prefix    = "/lex-audio-logs/"
        }
      }
    }]
  }
  sentiment_analysis_settings = {
    detect_sentiment = true
  }
}

resource "aws_iam_role" "lex_role" {
  name               = "${var.lexbot_complete_name}-LexBotRole"
  description        = "IAM role for ${var.lexbot_complete_name} Lex bot with Comprehend, Polly, and GenAI permissions"
  assume_role_policy = data.aws_iam_policy_document.lex_assume_role.json
}

resource "aws_iam_role_policy" "lex_policies" {
  name   = "${var.lexbot_complete_name}-lex-policies"
  role   = aws_iam_role.lex_role.id
  policy = data.aws_iam_policy_document.lex_policies.json
}

resource "aws_cloudwatch_log_group" "lexbot_log_group" {
  # This is a demo
  # checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  # checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "lex/${awscc_lex_bot.this.name}-logs"
  retention_in_days = 7
}

resource "awscc_connect_integration_association" "this" {
  instance_id      = var.instance_arn
  integration_arn  = awscc_lex_bot_alias.lexbot_alias.arn
  integration_type = "LEX_BOT"
}
