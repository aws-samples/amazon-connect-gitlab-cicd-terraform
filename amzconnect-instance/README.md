## Description

This folder houses the terraform that creates the Amazon Connect instance itself with the features that one would see in the AWS console.

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.2 |
| <a name="requirement_archive"></a> [archive](#requirement\_archive) | ~> 2.2.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.11.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 5.11.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_amazon_connect"></a> [amazon\_connect](#module\_amazon\_connect) | git::https://github.com/aws-ia/terraform-aws-amazonconnect.git | 1c714db279cef6e9105a806927aa08dd0539a8e1 |

## Resources

| Name | Type |
|------|------|
| [aws_iam_role.firehose](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role_policy.firehose](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy) | resource |
| [aws_kinesis_firehose_delivery_stream.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kinesis_firehose_delivery_stream) | resource |
| [aws_kinesis_stream.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kinesis_stream) | resource |
| [aws_kms_key.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key) | resource |
| [aws_s3_bucket.logging](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket) | resource |
| [aws_s3_bucket.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket) | resource |
| [aws_s3_bucket_public_access_block.logging](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_public_access_block) | resource |
| [aws_s3_bucket_public_access_block.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_public_access_block) | resource |
| [aws_s3_bucket_server_side_encryption_configuration.logging](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_server_side_encryption_configuration) | resource |
| [aws_s3_bucket_server_side_encryption_configuration.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_server_side_encryption_configuration) | resource |
| [aws_s3_bucket_versioning.logging](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_versioning) | resource |
| [aws_s3_bucket_versioning.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_versioning) | resource |
| [aws_ssm_parameter.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter) | resource |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_iam_policy_document.firehose_assume_role_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.firehose_role_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.this_key_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_env"></a> [env](#input\_env) | The name of the SDLC environment | `string` | `null` | no |
| <a name="input_instance_alias"></a> [instance\_alias](#input\_instance\_alias) | The name of the functional alias descriptor for the instance | `string` | `null` | no |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias descriptor for the instance | `string` | `null` | no |
| <a name="input_region"></a> [region](#input\_region) | The AWS region to deploy the instance | `string` | `null` | no |
| <a name="input_region_shortname"></a> [region\_shortname](#input\_region\_shortname) | The AWS region to deploy the instance | `string` | `null` | no |
| <a name="input_repo"></a> [repo](#input\_repo) | The name of the repository hosting the code for this deployment | `string` | `null` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->