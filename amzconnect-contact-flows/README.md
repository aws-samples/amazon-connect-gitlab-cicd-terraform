## Description.

This folder contains all Amazon Connect contact flows.

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.7 |
| <a name="requirement_archive"></a> [archive](#requirement\_archive) | ~> 2.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.0 |
| <a name="requirement_awscc"></a> [awscc](#requirement\_awscc) | ~> 1.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 5.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_connect_contact_flow.contact_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_contact_flow) | resource |
| [aws_connect_contact_flow_module.this](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/connect_contact_flow_module) | resource |
| [aws_connect_contact_flow.contact_flows](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_contact_flow) | data source |
| [aws_connect_contact_flow_module.modules](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/connect_contact_flow_module) | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_env"></a> [env](#input\_env) | The environment name for this deployment | `string` | `"dev"` | no |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias prefix descriptor for the instance | `string` | `null` | no |
| <a name="input_region"></a> [region](#input\_region) | AWS region to deploy into | `string` | n/a | yes |
| <a name="input_repo"></a> [repo](#input\_repo) | The name of the repository hosting the code for this deployment | `string` | `null` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_contact_flow_module_import_data"></a> [contact\_flow\_module\_import\_data](#output\_contact\_flow\_module\_import\_data) | The name of all contact flow modules to be imported into terraform state |
| <a name="output_contact_flow_modules"></a> [contact\_flow\_modules](#output\_contact\_flow\_modules) | The name of all contact flow modules in local directory |
| <a name="output_contact_flows"></a> [contact\_flows](#output\_contact\_flows) | The name of all contact flows in local directory |
| <a name="output_contact_flows_import_data"></a> [contact\_flows\_import\_data](#output\_contact\_flows\_import\_data) | The name of all contact flows to be imported into terraform state |
<!-- END_TF_DOCS -->
