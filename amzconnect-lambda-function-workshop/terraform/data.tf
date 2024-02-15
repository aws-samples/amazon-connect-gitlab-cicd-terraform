data "aws_ssm_parameter" "amzconnect-instance-id" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/${var.ivr_id}/amz-connect-instance-id"
}

data "aws_ssm_parameter" "bucket" {
  name = "/${var.env}/${local.region_shortnames[var.region]}/deploy-assets-bucket"
}

data "aws_caller_identity" "current" {}

data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.module}/../bin/lib/lambdas/callflowProvisioner"
  output_path = "${path.module}/callflowProvisioner.zip"
}

data "archive_file" "example_function" {
  type        = "zip"
  source_dir  = "${path.module}/../bin/lib/lambdas/exampleFunction"
  output_path = "${path.module}/exampleFunction.zip"
}

data "archive_file" "layer_source" {
  type        = "zip"
  source_dir  = "${path.module}/../bin/lib/layers/aws-layer"
  output_path = "${path.module}/aws-layer.zip"
}