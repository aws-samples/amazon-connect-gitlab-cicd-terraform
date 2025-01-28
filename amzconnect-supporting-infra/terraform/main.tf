module "lex_bot" {
  source = "../lexbot_module"

  instance_arn = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}"

  # Lex bot
  idle_session_ttl_in_seconds = var.idle_session_ttl_in_seconds
  lexbot_complete_name        = local.complete_name
  auto_build_bot_locales      = var.auto_build_bot_locales
  lexbot_description          = var.lexbot_description
  s3_bucket                   = module.s3_bucket.s3_bucket_id
  s3_object_key               = aws_s3_object.object.key

  # Lex bot Alias
  # A best practice is to use a consistent name for the alias across environments so that it can be invoked in a contact flow identically.
  lexbot_alias     = var.lexbot_alias
  audio_log_bucket = module.s3_bucket.s3_bucket_arn

  # Lex bot version
  source_bot_version = var.source_bot_version

  # Lexbot Role
  lexbot_iam_base_name = local.base_name

}

module "s3_bucket" {
  # This is a demo and using latest version
  # checkov:skip=CKV_TF_1: "Ensure Terraform module sources use a commit hash"
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

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
  depends_on  = [module.s3_bucket]
}


resource "aws_ssm_parameter" "deploy_assets_bucket" {
  # SSM Parameters aren't sensitive
  # checkov:skip=CKV_AWS_337: "Ensure SSM parameters are using KMS CMK"
  # checkov:skip=CKV2_AWS_34: "AWS SSM Parameter should be Encrypted"
  name        = "/${var.env}/${local.region_shortnames[var.region]}/deploy-assets-bucket1"
  description = "The parameter description"
  type        = "String"
  # overwrite   = true
  value = module.s3_bucket.s3_bucket_id
  tags = {
    environment = var.env
  }
}
