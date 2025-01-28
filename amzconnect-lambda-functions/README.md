## Description

This folder houses all code to provision lambda functions associated with this workshop.

<!-- BEGIN_TF_DOCS -->

## Requirements

| Name                                                                     | Version   |
| ------------------------------------------------------------------------ | --------- |
| <a name="requirement_terraform"></a> [terraform](#requirement_terraform) | >= 1.7    |
| <a name="requirement_archive"></a> [archive](#requirement_archive)       | ~> 2.4.0  |
| <a name="requirement_aws"></a> [aws](#requirement_aws)                   | ~> 5.35.0 |

## Providers

| Name                                                   | Version   |
| ------------------------------------------------------ | --------- |
| <a name="provider_aws"></a> [aws](#provider_aws)       | ~> 5.35.0 |
| <a name="provider_awscc"></a> [awscc](#provider_awscc) | n/a       |

## Modules

| Name                                                                             | Source                                                                 | Version                                  |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| <a name="module_lambda_function"></a> [lambda_function](#module_lambda_function) | git::https://github.com/terraform-aws-modules/terraform-aws-lambda.git | c173c27fb57969da85967f2896b858c4654b0bba |

## Resources

| Name                                                                                                                                                        | Type        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [awscc_connect_integration_association.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/connect_integration_association) | resource    |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity)                               | data source |
| [aws_ssm_parameter.amzconnect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter)                    | data source |

## Inputs

| Name                                                                     | Description                                                         | Type     | Default | Required |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------- | ------- | :------: |
| <a name="input_capability_id"></a> [capability_id](#input_capability_id) | The name of the capability descriptor for the microservice          | `string` | `null`  |    no    |
| <a name="input_env"></a> [env](#input_env)                               | n/a                                                                 | `string` | `"dev"` |    no    |
| <a name="input_ivr_id"></a> [ivr_id](#input_ivr_id)                      | The name of the functional alias prefix descriptor for the instance | `string` | `null`  |    no    |
| <a name="input_region"></a> [region](#input_region)                      | n/a                                                                 | `string` | n/a     |   yes    |
| <a name="input_repo"></a> [repo](#input_repo)                            | The name of the repository hosting the code for this deployment     | `string` | `null`  |    no    |

## Outputs

No outputs.

<!-- END_TF_DOCS -->
