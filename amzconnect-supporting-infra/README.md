## Description.

This folder houses all code to provision supporting infrastructure such as an S3 bucket and lexbots associated with this workshop..

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.7 |
| <a name="requirement_archive"></a> [archive](#requirement\_archive) | ~> 2.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.0 |
| <a name="requirement_awscc"></a> [awscc](#requirement\_awscc) | ~> 1.0 |
| <a name="requirement_external"></a> [external](#requirement\_external) | ~> 2.0 |
| <a name="requirement_null"></a> [null](#requirement\_null) | ~> 3.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_archive"></a> [archive](#provider\_archive) | ~> 2.0 |
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 5.0 |
| <a name="provider_awscc"></a> [awscc](#provider\_awscc) | ~> 1.0 |
| <a name="provider_external"></a> [external](#provider\_external) | ~> 2.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_lex_bots"></a> [lex\_bots](#module\_lex\_bots) | ../lexbot_module | n/a |
| <a name="module_s3_bucket"></a> [s3\_bucket](#module\_s3\_bucket) | terraform-aws-modules/s3-bucket/aws | ~> 4.0 |

## Resources

| Name | Type |
|------|------|
| [aws_s3_object.bot_objects](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_object) | resource |
| [aws_ssm_parameter.deploy_assets_bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter) | resource |
| [archive_file.lexbots](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_region.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/region) | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |
| [awscc_lex_bot.lex_bot](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/data-sources/lex_bot) | data source |
| [external_external.aws_cli_get_bot_prod_alias](https://registry.terraform.io/providers/hashicorp/external/latest/docs/data-sources/external) | data source |
| [external_external.aws_cli_list_lex_bots](https://registry.terraform.io/providers/hashicorp/external/latest/docs/data-sources/external) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_auto_build_bot_locales"></a> [auto\_build\_bot\_locales](#input\_auto\_build\_bot\_locales) | Specifies whether to build the bot locales after bot creation completes. | `bool` | `true` | no |
| <a name="input_env"></a> [env](#input\_env) | The name of the SDLC environment | `string` | `"dev"` | no |
| <a name="input_idle_session_ttl_in_seconds"></a> [idle\_session\_ttl\_in\_seconds](#input\_idle\_session\_ttl\_in\_seconds) | IdleSessionTTLInSeconds of the resource | `number` | n/a | yes |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias descriptor for the instance | `string` | `null` | no |
| <a name="input_lexbot_alias"></a> [lexbot\_alias](#input\_lexbot\_alias) | Lex bot name for this resource | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | AWS region: us-east-1, us-west-2. Used to build resource name. | `string` | `"us-west-2"` | no |
| <a name="input_repo"></a> [repo](#input\_repo) | The name of the repository hosting the code for this deployment | `string` | `null` | no |
| <a name="input_source_bot_version"></a> [source\_bot\_version](#input\_source\_bot\_version) | source lex bot version number to base new version upon | `string` | `"DRAFT"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_existing_bots"></a> [existing\_bots](#output\_existing\_bots) | list of bots already in AWS |
| <a name="output_flattened_lex_bot_alias_arns"></a> [flattened\_lex\_bot\_alias\_arns](#output\_flattened\_lex\_bot\_alias\_arns) | Flattened list of lex bot alias arns |
| <a name="output_get_lambda_codehooks_by_locale"></a> [get\_lambda\_codehooks\_by\_locale](#output\_get\_lambda\_codehooks\_by\_locale) | lambda\_codehooks\_by\_locale |
| <a name="output_lex_bots_import_data"></a> [lex\_bots\_import\_data](#output\_lex\_bots\_import\_data) | Lex bot import data |
<!-- END_TF_DOCS -->