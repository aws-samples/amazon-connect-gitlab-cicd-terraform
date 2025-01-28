## Description

This folder houses all of the Amazon Connect resources which exist within the Amazon Connect console itself.

<!-- BEGIN_TF_DOCS -->

## Requirements

| Name                                                                     | Version |
| ------------------------------------------------------------------------ | ------- |
| <a name="requirement_terraform"></a> [terraform](#requirement_terraform) | >= 1.7  |
| <a name="requirement_archive"></a> [archive](#requirement_archive)       | ~> 2.0  |
| <a name="requirement_aws"></a> [aws](#requirement_aws)                   | ~> 5.0  |
| <a name="requirement_awscc"></a> [awscc](#requirement_awscc)             | ~> 1.0  |

## Providers

| Name                                                   | Version |
| ------------------------------------------------------ | ------- |
| <a name="provider_aws"></a> [aws](#provider_aws)       | 5.72.1  |
| <a name="provider_awscc"></a> [awscc](#provider_awscc) | 1.16.1  |

## Modules

| Name                                                                          | Source                                                         | Version                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| <a name="module_amazon_connect"></a> [amazon_connect](#module_amazon_connect) | git::https://github.com/aws-ia/terraform-aws-amazonconnect.git | 1c714db279cef6e9105a806927aa08dd0539a8e1 |

## Resources

| Name                                                                                                                                             | Type        |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| [aws_connect_hours_of_operation.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_hours_of_operation)    | resource    |
| [aws_connect_queue.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_queue)                              | resource    |
| [aws_connect_quick_connect.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_quick_connect)              | resource    |
| [aws_connect_routing_profile.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_routing_profile)          | resource    |
| [aws_connect_security_profile.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_security_profile)        | resource    |
| [awscc_connect_agent_status.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/connect_agent_status)            | resource    |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity)                    | data source |
| [aws_connect_contact_flow.default_outbound](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_contact_flow) | data source |
| [aws_connect_queue.basicqueue](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_queue)                     | data source |
| [aws_connect_quick_connect.qcs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_quick_connect)            | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter)        | data source |

## Inputs

| Name                                                         | Description                                                         | Type     | Default | Required |
| ------------------------------------------------------------ | ------------------------------------------------------------------- | -------- | ------- | :------: |
| <a name="input_env"></a> [env](#input_env)                   | The name of the SDLC environment                                    | `string` | `null`  |    no    |
| <a name="input_ivr_id"></a> [ivr_id](#input_ivr_id)          | The name of the functional alias prefix descriptor for the instance | `string` | `null`  |    no    |
| <a name="input_qc_option"></a> [qc_option](#input_qc_option) | n/a                                                                 | `bool`   | `true`  |    no    |
| <a name="input_region"></a> [region](#input_region)          | The AWS region to deploy the instance                               | `string` | `null`  |    no    |
| <a name="input_repo"></a> [repo](#input_repo)                | The name of the repository hosting the code for this deployment     | `string` | `null`  |    no    |

## Outputs

| Name                                                                                               | Description |
| -------------------------------------------------------------------------------------------------- | ----------- |
| <a name="output_agent_statuses"></a> [agent_statuses](#output_agent_statuses)                      | n/a         |
| <a name="output_hoops"></a> [hoops](#output_hoops)                                                 | n/a         |
| <a name="output_queues"></a> [queues](#output_queues)                                              | n/a         |
| <a name="output_quick_connect_configs"></a> [quick_connect_configs](#output_quick_connect_configs) | n/a         |
| <a name="output_routing_profiles"></a> [routing_profiles](#output_routing_profiles)                | n/a         |
| <a name="output_routing_profiles2"></a> [routing_profiles2](#output_routing_profiles2)             | n/a         |

<!-- END_TF_DOCS -->

#
