# Create zip files for each bot
data "archive_file" "lexbots" {
  for_each = local.bots

  type        = "zip"
  output_path = "${each.key}.zip"
  source_dir  = "${local.bots_state_root_dir}/${each.key}"
  excludes    = ["${local.bots_state_root_dir}/${each.key}/aliases.json"]
}

# Upload each bot zip to S3
resource "aws_s3_object" "bot_objects" {
  for_each = local.bots

  bucket      = module.s3_bucket.s3_bucket_id
  key         = "assets/${var.env}/${each.value.name}.zip"
  source      = "${each.key}.zip"
  source_hash = data.archive_file.lexbots[each.key].output_md5
  depends_on  = [module.s3_bucket, data.archive_file.lexbots]
}

# Create a Lex bot module for each bot
module "lex_bots" {
  source = "../lexbot_module"

  for_each = local.bots

  instance_arn = "arn:aws:connect:${var.region}:${data.aws_caller_identity.current.account_id}:instance/${nonsensitive(data.aws_ssm_parameter.amz-connect-instance-id.value)}"

  # Lex bot - use values from the bot configuration
  idle_session_ttl_in_seconds = each.value.idle_session_ttl
  lexbot_complete_name        = each.key
  auto_build_bot_locales      = var.auto_build_bot_locales
  s3_bucket                   = module.s3_bucket.s3_bucket_id
  s3_object_key               = aws_s3_object.bot_objects[each.key].key
  s3_obj_version_id           = aws_s3_object.bot_objects[each.key].version_id

  # Lex bot Alias
  lexbot_alias     = var.lexbot_alias
  audio_log_bucket = module.s3_bucket.s3_bucket_arn

  # Lex bot version
  source_bot_version = var.source_bot_version

  # Bot locales
  lexbot_languages = each.value.locales

  # Lexbot Role
  lexbot_iam_base_name = each.value.base_name

  #   # Lambda Codehook - use the pre-computed value from locals
  #   lambda_code_hook_arn = local.get_lambda_codehook[each.key]

  # Add the new parameter for locale-specific Lambda codehooks
  lambda_codehooks_by_locale = local.get_lambda_codehooks_by_locale[each.key]
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
    environment = var.env
  }
}
