locals {
  s3_filepath = "../contact_flows"
}

resource "aws_s3_object" "contact_flows" {
  for_each    = fileset(local.s3_filepath, "**")
  bucket      = data.aws_ssm_parameter.bucket.value
  key         = "${var.ivr_id}/callflows/${each.key}"
  source      = "${local.s3_filepath}/${each.value}"
  source_hash = filemd5("${local.s3_filepath}/${each.value}")
}