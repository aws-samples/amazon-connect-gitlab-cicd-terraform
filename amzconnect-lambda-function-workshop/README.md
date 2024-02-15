## Description

This folder houses all typescript code to provision lambda functions associated with this workshop.

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.2 |
| <a name="requirement_archive"></a> [archive](#requirement\_archive) | ~> 2.4.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.11.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_archive"></a> [archive](#provider\_archive) | ~> 2.4.0 |
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 5.11.0 |
| <a name="provider_awscc"></a> [awscc](#provider\_awscc) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_lambda_function"></a> [lambda\_function](#module\_lambda\_function) | git::https://github.com/terraform-aws-modules/terraform-aws-lambda.git | c173c27fb57969da85967f2896b858c4654b0bba |
| <a name="module_lambda_provisioner_function"></a> [lambda\_provisioner\_function](#module\_lambda\_provisioner\_function) | git::https://github.com/terraform-aws-modules/terraform-aws-lambda.git | c173c27fb57969da85967f2896b858c4654b0bba |

## Resources

| Name | Type |
|------|------|
| [aws_lambda_layer_version.aws_layer](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_layer_version) | resource |
| [aws_s3_object.config_object](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_object) | resource |
| [aws_s3_object.template_objects](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_object) | resource |
| [aws_ssm_parameter.provisioner_arn](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter) | resource |
| [awscc_connect_integration_association.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/connect_integration_association) | resource |
| [archive_file.example_function](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [archive_file.layer_source](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [archive_file.source](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_ssm_parameter.amzconnect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |
| [aws_ssm_parameter.bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_capability_id"></a> [capability\_id](#input\_capability\_id) | The name of the capability descriptor for the microservice | `string` | `null` | no |
| <a name="input_env"></a> [env](#input\_env) | n/a | `string` | `"dev"` | no |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias descriptor for the instance | `string` | `null` | no |
| <a name="input_region"></a> [region](#input\_region) | n/a | `string` | n/a | yes |
| <a name="input_repo"></a> [repo](#input\_repo) | The name of the repository hosting the code for this deployment | `string` | `null` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_instance_arn"></a> [instance\_arn](#output\_instance\_arn) | n/a |
<!-- END_TF_DOCS -->