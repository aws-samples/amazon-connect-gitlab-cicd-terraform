locals {
  configs = fileset(local.s3_filepath, "**")
}

resource "aws_lambda_invocation" "this" {
  function_name = data.aws_ssm_parameter.provisioner_arn.value

  triggers = {
    redeploy = timestamp()
  }

  input      = <<JSON
{
  "ivr_id": "${var.ivr_id}",
  "capability_id": "${var.capability_id}"
}
JSON
  depends_on = [aws_s3_object.contact_flows]
}

output "result_entry" {
  value = jsondecode(aws_lambda_invocation.this.result)
}