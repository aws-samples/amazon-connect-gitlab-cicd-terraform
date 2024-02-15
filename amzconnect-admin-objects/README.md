## Description

This folder houses all Amazon Connect admin objects which are basically items that exist within the Amazon Connect console itself.

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
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_capability_id"></a> [capability\_id](#input\_capability\_id) | The name of the capability descriptor for the microservice | `string` | `null` | no |
| <a name="input_env"></a> [env](#input\_env) | The name of the SDLC environment | `string` | `null` | no |
| <a name="input_instance_alias"></a> [instance\_alias](#input\_instance\_alias) | The name of the Amazon Connect instance | `string` | `null` | no |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias prefix descriptor for the instance | `string` | `null` | no |
| <a name="input_region"></a> [region](#input\_region) | The AWS region to deploy the instance | `string` | `null` | no |
| <a name="input_region_shortname"></a> [region\_shortname](#input\_region\_shortname) | The AWS region to deploy the instance | `string` | `null` | no |
| <a name="input_repo"></a> [repo](#input\_repo) | The name of the repository hosting the code for this deployment | `string` | `null` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->