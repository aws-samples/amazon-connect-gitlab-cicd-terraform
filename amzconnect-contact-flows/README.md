## Description

This folder contains all Amazon Connect contact flows.

<!-- BEGIN_TF_DOCS -->

## Requirements

| Name                                                                     | Version |
| ------------------------------------------------------------------------ | ------- |
| <a name="requirement_terraform"></a> [terraform](#requirement_terraform) | >= 1.7  |

## Providers

| Name                                             | Version |
| ------------------------------------------------ | ------- |
| <a name="provider_aws"></a> [aws](#provider_aws) | n/a     |

## Modules

No modules.

## Resources

| Name                                                                                                                                                  | Type        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [aws_connect_contact_flow.contact_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_contact_flow)            | resource    |
| [aws_connect_contact_flow_module.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_contact_flow_module)       | resource    |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity)                         | data source |
| [aws_connect_contact_flow.contact_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_contact_flow)         | data source |
| [aws_connect_contact_flow_module.modules](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_contact_flow_module) | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter)             | data source |

## Inputs

| Name                                                                     | Description                                                         | Type     | Default | Required |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------- | ------- | :------: |
| <a name="input_capability_id"></a> [capability_id](#input_capability_id) | The name of the capability descriptor for the microservice          | `string` | `null`  |    no    |
| <a name="input_env"></a> [env](#input_env)                               | n/a                                                                 | `string` | `"dev"` |    no    |
| <a name="input_ivr_id"></a> [ivr_id](#input_ivr_id)                      | The name of the functional alias prefix descriptor for the instance | `string` | `null`  |    no    |
| <a name="input_region"></a> [region](#input_region)                      | n/a                                                                 | `string` | n/a     |   yes    |
| <a name="input_repo"></a> [repo](#input_repo)                            | The name of the repository hosting the code for this deployment     | `string` | `null`  |    no    |

## Outputs

| Name                                                                                                                             | Description |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| <a name="output_contact_flow_module_import_data"></a> [contact_flow_module_import_data](#output_contact_flow_module_import_data) | n/a         |
| <a name="output_contact_flow_modules"></a> [contact_flow_modules](#output_contact_flow_modules)                                  | n/a         |
| <a name="output_contact_flows"></a> [contact_flows](#output_contact_flows)                                                       | n/a         |
| <a name="output_contact_flows_import_data"></a> [contact_flows_import_data](#output_contact_flows_import_data)                   | n/a         |

<!-- END_TF_DOCS -->
