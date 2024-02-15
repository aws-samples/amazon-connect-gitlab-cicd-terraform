# resource "aws_s3_object" "object" {
#   bucket = var.bucket
#   key    = "${var.ivr_id}/config/includes.json"
#   source = "${path.module}/configurations/includes.json"
#   etag   = filemd5("${path.module}/configurations/includes.json")
# }

locals {
  s3_config_filepath   = "../configurations"
  s3_template_filepath = "../templates"
}

resource "aws_s3_object" "config_object" {
  for_each = fileset(local.s3_config_filepath, "**")
  bucket   = data.aws_ssm_parameter.bucket.value
  key      = "config/${each.key}"
  source   = "${local.s3_config_filepath}/${each.value}"
  etag     = filemd5("${local.s3_config_filepath}/${each.value}")
}

resource "aws_s3_object" "template_objects" {
  for_each = fileset(local.s3_template_filepath, "**")
  bucket   = data.aws_ssm_parameter.bucket.value
  key      = "templates/${each.key}"
  source   = "${local.s3_template_filepath}/${each.value}"
  etag     = filemd5("${local.s3_template_filepath}/${each.value}")
}