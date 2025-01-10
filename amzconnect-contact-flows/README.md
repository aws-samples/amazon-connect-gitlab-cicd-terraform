## Description

This folder houses all Amazon Connect contact flows.

<!-- BEGIN_TF_DOCS -->

## Requirements

| Name                                                                     | Version   |
| ------------------------------------------------------------------------ | --------- |
| <a name="requirement_terraform"></a> [terraform](#requirement_terraform) | >= 1.2    |
| <a name="requirement_archive"></a> [archive](#requirement_archive)       | ~> 2.4.0  |
| <a name="requirement_aws"></a> [aws](#requirement_aws)                   | ~> 5.11.0 |

## Providers

| Name                                             | Version   |
| ------------------------------------------------ | --------- |
| <a name="provider_aws"></a> [aws](#provider_aws) | ~> 5.11.0 |

## Modules

No modules.

## Resources

| Name                                                                                                                                     | Type        |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [aws_lambda_invocation.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_invocation)              | resource    |
| [aws_s3_object.contact_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_object)                     | resource    |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity)            | data source |
| [aws_ssm_parameter.amzconnect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |
| [aws_ssm_parameter.bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter)                 | data source |
| [aws_ssm_parameter.provisioner_arn](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter)        | data source |

## Inputs

| Name                                                                     | Description                                                         | Type     | Default | Required |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------- | ------- | :------: |
| <a name="input_capability_id"></a> [capability_id](#input_capability_id) | The name of the capability descriptor for the microservice          | `string` | `null`  |    no    |
| <a name="input_env"></a> [env](#input_env)                               | n/a                                                                 | `string` | `"dev"` |    no    |
| <a name="input_ivr_id"></a> [ivr_id](#input_ivr_id)                      | The name of the functional alias prefix descriptor for the instance | `string` | `null`  |    no    |
| <a name="input_region"></a> [region](#input_region)                      | n/a                                                                 | `string` | n/a     |   yes    |
| <a name="input_repo"></a> [repo](#input_repo)                            | The name of the repository hosting the code for this deployment     | `string` | `null`  |    no    |

## Outputs

| Name                                                                    | Description |
| ----------------------------------------------------------------------- | ----------- |
| <a name="output_result_entry"></a> [result_entry](#output_result_entry) | n/a         |

<!-- END_TF_DOCS -->
