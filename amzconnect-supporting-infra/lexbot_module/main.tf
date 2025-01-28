resource "null_resource" "redeploy_trigger" {
  triggers = {
    s3_obj_version_id = var.s3_obj_version_id
  }
}

resource "awscc_lex_bot" "this" {
  lifecycle {
    replace_triggered_by = [
      # Replace `awscc_lex_bot` each time the content of
      # the lex bot is modified. This is mostly to circumvent issues with replace api on awscc provider.
      null_resource.redeploy_trigger
    ]
  }
  data_privacy = {
    child_directed = false
  }
  idle_session_ttl_in_seconds = var.idle_session_ttl_in_seconds
  name                        = var.lexbot_complete_name
  role_arn                    = module.lexbot_role.iam_role_arn
  auto_build_bot_locales      = var.auto_build_bot_locales
  description                 = var.lexbot_description
  bot_file_s3_location = {
    s3_bucket     = var.s3_bucket
    s3_object_key = var.s3_object_key
    # s3_object_version = aws_s3_object.object.version_id
  }
}


resource "aws_lexv2models_bot_version" "lexbot_version" {
  bot_id = awscc_lex_bot.this.id
  locale_specification = {
    "en_US" = {
      source_bot_version = var.source_bot_version
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "awscc_lex_bot_alias" "lexbot_alias" {
  # A best practice is to use a consistent name for the alias across environments so that it can be invoked in a contact flow identically.
  bot_alias_name = var.lexbot_alias
  bot_id         = awscc_lex_bot.this.id
  bot_alias_locale_settings = [
    {
      bot_alias_locale_setting = {
        enabled = true
      }
      locale_id = "en_US"
    }
  ]
  bot_version = aws_lexv2models_bot_version.lexbot_version.bot_version
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

#####################################################
# IAM assumable role with custom policies for Lex bot
#####################################################
module "lexbot_role" {
  # This is a demo and using latest
  # checkov:skip=CKV_TF_1: "Ensure Terraform module sources use a commit hash"

  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version = "~> 5.0"


  trusted_role_services = [
    "lexv2.amazonaws.com"
  ]

  create_role = true

  role_name_prefix  = "${var.lexbot_iam_base_name}-role"
  role_requires_mfa = false

  custom_role_policy_arns = [
    module.iam_policy.arn
  ]
}

#########################################
# IAM policy for Lex bot
#########################################
module "iam_policy" {
  # This is a demo and using latest
  # checkov:skip=CKV_TF_1: "Ensure Terraform module sources use a commit hash"
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 5.0"

  name        = "${var.lexbot_iam_base_name}-policy"
  path        = "/"
  description = "Policy attached to ${var.lexbot_iam_base_name}-role"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "comprehend:DetectSentiment",
                "polly:SynthesizeSpeech"
            ],
            "Resource": "*",
            "Effect": "Allow",
            "Sid": "lexPolicies"
        },
        {
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "${aws_cloudwatch_log_group.lexbot_log_group.arn}:*",
            "Effect": "Allow",
            "Sid": "loggingPolicies"
        }
    ]
}
EOF
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