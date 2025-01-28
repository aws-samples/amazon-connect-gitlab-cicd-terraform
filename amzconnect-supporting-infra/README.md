## Description

This folder houses all code to provision supporting infrastructure such as an S3 bucket and lexbots associated with this workshop.

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.7 |
| <a name="requirement_archive"></a> [archive](#requirement\_archive) | ~> 2.4.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 5.35.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_archive"></a> [archive](#provider\_archive) | ~> 2.4.0 |
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 5.35.0 |
| <a name="provider_awscc"></a> [awscc](#provider\_awscc) | n/a |
| <a name="provider_null"></a> [null](#provider\_null) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_iam_policy"></a> [iam\_policy](#module\_iam\_policy) | terraform-aws-modules/iam/aws//modules/iam-policy | n/a |
| <a name="module_lexbot_role"></a> [lexbot\_role](#module\_lexbot\_role) | terraform-aws-modules/iam/aws//modules/iam-assumable-role | n/a |
| <a name="module_s3_bucket"></a> [s3\_bucket](#module\_s3\_bucket) | terraform-aws-modules/s3-bucket/aws | n/a |

## Resources

| Name | Type |
|------|------|
| [aws_cloudwatch_log_group.lexbot_log_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_group) | resource |
| [aws_s3_object.object](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_object) | resource |
| [aws_ssm_parameter.deploy_assets_bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter) | resource |
| [awscc_connect_integration_association.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/connect_integration_association) | resource |
| [awscc_lex_bot.this](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/lex_bot) | resource |
| [awscc_lex_bot_alias.lexbot_alias](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/lex_bot_alias) | resource |
| [awscc_lex_bot_version.lexbot_version](https://registry.terraform.io/providers/hashicorp/awscc/latest/docs/resources/lex_bot_version) | resource |
| [null_resource.redeploy_trigger](https://registry.terraform.io/providers/hashicorp/null/latest/docs/resources/resource) | resource |
| [archive_file.lexbot](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/file) | data source |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_ssm_parameter.amz-connect-instance-id](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_account"></a> [account](#input\_account) | n/a | `string` | `"251778280686"` | no |
| <a name="input_app"></a> [app](#input\_app) | n/a | `string` | `"ACME"` | no |
| <a name="input_auto_build_bot_locales"></a> [auto\_build\_bot\_locales](#input\_auto\_build\_bot\_locales) | Specifies whether to build the bot locales after bot creation completes. | `bool` | `true` | no |
| <a name="input_bot_file_s3_location"></a> [bot\_file\_s3\_location](#input\_bot\_file\_s3\_location) | S3 location of bot definitions zip file, if it's not defined locally | <pre>object({<br>    s3_bucket         = string<br>    s3_object_key     = string<br>    s3_object_version = string<br>  })</pre> | `null` | no |
| <a name="input_bucket"></a> [bucket](#input\_bucket) | n/a | `string` | `"callflow-bucket-dev-us-east-1-1689174870695"` | no |
| <a name="input_capability_id"></a> [capability\_id](#input\_capability\_id) | The name of the capability descriptor for the microservice | `string` | `null` | no |
| <a name="input_deploy_role_arn"></a> [deploy\_role\_arn](#input\_deploy\_role\_arn) | n/a | `string` | `null` | no |
| <a name="input_env"></a> [env](#input\_env) | n/a | `string` | `"dev"` | no |
| <a name="input_idle_session_ttl_in_seconds"></a> [idle\_session\_ttl\_in\_seconds](#input\_idle\_session\_ttl\_in\_seconds) | IdleSessionTTLInSeconds of the resource | `number` | n/a | yes |
| <a name="input_ivr_id"></a> [ivr\_id](#input\_ivr\_id) | The name of the functional alias prefix descriptor for the instance | `string` | `null` | no |
| <a name="input_lexbot_alias"></a> [lexbot\_alias](#input\_lexbot\_alias) | Lex bot name for this resource | `string` | n/a | yes |
| <a name="input_lexbot_description"></a> [lexbot\_description](#input\_lexbot\_description) | Lex Bot Description | `string` | `""` | no |
| <a name="input_lexbot_name"></a> [lexbot\_name](#input\_lexbot\_name) | Lex bot name for this resource | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | AWS region: us-east-1, us-west-2. Used to build resource name. | `string` | n/a | yes |
| <a name="input_region_shortname"></a> [region\_shortname](#input\_region\_shortname) | AWS region shortnames. Do not override. | `map(string)` | <pre>{<br>  "us-east-1": "use1",<br>  "us-west-2": "usw2"<br>}</pre> | no |
| <a name="input_repo"></a> [repo](#input\_repo) | The name of the repository hosting the code for this deployment | `string` | `null` | no |
| <a name="input_s3_obj_version_id"></a> [s3\_obj\_version\_id](#input\_s3\_obj\_version\_id) | Version id for lex bot s3 asset. Used to force redeploy via lifecycle policy | `string` | `"default"` | no |

## Outputs

No outputs.
<!-- END_TF_DOCS -->