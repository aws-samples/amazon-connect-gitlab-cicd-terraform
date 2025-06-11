## Description.

This folder houses all Amazon Connect admin objects which are basically items that exist within the Amazon Connect console itself.

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.7 |
| <a name="requirement_archive"></a> [archive](#requirement\_archive) | ~> 2.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.0 |
| <a name="requirement_awscc"></a> [awscc](#requirement\_awscc) | ~> 1.0 |
| <a name="requirement_external"></a> [external](#requirement\_external) | ~> 2.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 5.0 |
| <a name="provider_awscc"></a> [awscc](#provider\_awscc) | ~> 1.0 |
| <a name="provider_external"></a> [external](#provider\_external) | ~> 2.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_connect_contact_flow.outbound_whisper_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_contact_flow) | resource |
| [aws_connect_contact_flow.queue_transfer_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_contact_flow) | resource |
| [aws_connect_hours_of_operation.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_hours_of_operation) | resource |
| [aws_connect_queue.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_queue) | resource |
| [aws_connect_quick_connect.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_quick_connect) | resource |
| [aws_connect_routing_profile.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_routing_profile) | resource |
| [aws_connect_security_profile.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_security_profile) | resource |
| [aws_connect_user.finance_agent](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_user) | resource |
| [aws_connect_user.sales_agent](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_user) | resource |
| [awscc_connect_agent_status.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/connect_agent_status) | resource |
| [awscc_connect_view.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/connect_view) | resource |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_connect_hours_of_operation.basic_hours](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_hours_of_operation) | data source |
| [aws_connect_queue.basicqueue](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_queue) | data source |
| [aws_connect_quick_connect.qcs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_quick_connect) | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |
| [external_external.aws_cli_list_contact_flows](https://registry.terraform.io/providers/hashicorp/external/latest/docs/data-sources/external) | data source |
| [external_external.aws_cli_list_phone_numbers](https://registry.terraform.io/providers/hashicorp/external/latest/docs/data-sources/external) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_env"></a> [env](#input\_env) | The name of the SDLC environment | `string` | `null` | no |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias prefix descriptor for the instance | `string` | `null` | no |
| <a name="input_qc_option"></a> [qc\_option](#input\_qc\_option) | variable determining whether quick connects will be added to a queue or not | `bool` | `false` | no |
| <a name="input_region"></a> [region](#input\_region) | The AWS region to deploy the instance | `string` | `null` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->