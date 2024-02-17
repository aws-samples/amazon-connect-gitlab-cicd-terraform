module "s3_bucket" {
  # This is a demo and using latest version
  # checkov:skip=CKV_TF_1: "Ensure Terraform module sources use a commit hash"
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "${var.env}-${var.region}-s3-connect-cicd-terraform-workshop-${data.aws_caller_identity.current.account_id}"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  }
}

resource "aws_s3_object" "object" {
  bucket      = module.s3_bucket.s3_bucket_id
  key         = "assets/${var.env}/ACME_lexbot.zip"
  source      = "./ACME_lexbot.zip"
  source_hash = data.archive_file.lexbot.output_md5
}


resource "null_resource" "redeploy_trigger" {
  triggers = {
    s3_obj_version_id = aws_s3_object.object.version_id
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
  name                        = "${var.capability_id}-${var.lexbot_name}-${var.ivr_id}"
  role_arn                    = module.lexbot_role.iam_role_arn
  auto_build_bot_locales      = var.auto_build_bot_locales
  description                 = var.lexbot_description
  bot_file_s3_location = {
    s3_bucket     = module.s3_bucket.s3_bucket_id
    s3_object_key = aws_s3_object.object.key
    # s3_object_version = aws_s3_object.object.version_id
  }
}


resource "awscc_lex_bot_version" "InfraStackACMElexbotVersion" {
  bot_id = awscc_lex_bot.this.id
  bot_version_locale_specification = [
    {
      locale_id = "en_US"
      bot_version_locale_details = {
        source_bot_version = "DRAFT"
      }
    },
  ]
  description = "initial version"
}

resource "awscc_lex_bot_alias" "InfraStackACMElexbotAlias" {
  bot_alias_name = var.env
  bot_id         = awscc_lex_bot.this.id
  bot_alias_locale_settings = [
    {
      bot_alias_locale_setting = {
        enabled = true
      }
      locale_id = "en_US"
    }
  ]
  bot_version = awscc_lex_bot_version.InfraStackACMElexbotVersion.bot_version
  conversation_log_settings = {
    enabled = true
    text_log_settings = [
      {
        destination = {
          cloudwatch = {
            cloudwatch_log_group_arn = aws_cloudwatch_log_group.ACMElexbotLogGroup.arn
            log_prefix               = "/aws/lex/ACME_lexbot/${var.env}"
          }
        }
        enabled = true
      }
    ]
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

  source = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"

  trusted_role_services = [
    "lexv2.amazonaws.com"
  ]

  create_role = true

  role_name_prefix  = "${var.env}-${local.region_shortnames[var.region]}-lex-${var.ivr_id}-${var.lexbot_name}-role"
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
  source = "terraform-aws-modules/iam/aws//modules/iam-policy"

  name        = "${var.env}-${local.region_shortnames[var.region]}-lex-${var.ivr_id}-${var.lexbot_name}-policy"
  path        = "/"
  description = "Policy attached to ${var.env}-${local.region_shortnames[var.region]}-lex-${var.ivr_id}-${var.lexbot_name}-role"

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
            "Resource": "${aws_cloudwatch_log_group.ACMElexbotLogGroup.arn}:*",
            "Effect": "Allow",
            "Sid": "loggingPolicies"
        }
    ]
}
EOF
}

resource "aws_cloudwatch_log_group" "ACMElexbotLogGroup" {
  # This is a demo
  # checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  # checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "${awscc_lex_bot.this.id}-logs"
  retention_in_days = 7

}

resource "aws_ssm_parameter" "deploy_assets_bucket" {
  # SSM Parameters aren't sensitive
  # checkov:skip=CKV_AWS_337: "Ensure SSM parameters are using KMS CMK"
  # checkov:skip=CKV2_AWS_34: "AWS SSM Parameter should be Encrypted"
  name        = "/${var.env}/${local.region_shortnames[var.region]}/deploy-assets-bucket"
  description = "The parameter description"
  type        = "String"
  # overwrite   = true
  value = module.s3_bucket.s3_bucket_id
  tags = {
    environment = "${var.env}"
  }
}

resource "awscc_connect_integration_association" "this" {
  instance_id      = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}"
  integration_arn  = awscc_lex_bot_alias.InfraStackACMElexbotAlias.arn
  integration_type = "LEX_BOT"
}