# Configure OpenID Connect (OIDC) between AWS and GitLab that assumes role in SDLC account


## Use-cases
* Retrieve temporary credentials from AWS to access cloud services
* Use credentials to assume another role
* Scope role to branch or project

For additional details, see [documentation here](https://docs.gitlab.com/ee/ci/cloud_services/aws/)


## Steps

1. Run terraform locally to provision AWS resources. We are going to create a role with policy attached that has power user access, and assume policy that will be assumed by the role created in the previous step.

1. Add a `tf.tfvars` file with your gitlab_url, [aud value, and match value](https://docs.gitlab.com/ee/ci/cloud_services/#configure-a-conditional-role-with-oidc-claims).
    This example would allow any project in the `mygroup` group running a job for the `main` branch.
    ```
    aws_region      = "us-east-1"
    devops_role_arn = ["DEVOPS_ROLE_CREATED_IN_PREVIOUS_STEP"]
    ```
1.  Run terraform init, plan, and apply. 


<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | >= 4.26 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | >= 4.26 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_iam_policy.power_user_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_policy) | resource |
| [aws_iam_role.gitlab_ci](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_policy_document.assume-role-policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_region"></a> [aws\_region](#input\_aws\_region) | n/a | `string` | n/a | yes |
| <a name="input_devops_role_arn"></a> [devops\_role\_arn](#input\_devops\_role\_arn) | n/a | `list(any)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_ROLE_ARN"></a> [ROLE\_ARN](#output\_ROLE\_ARN) | Role that needs to be assumed by GitLab CI. We will use this as a GitLab CI Variable |
<!-- END_TF_DOCS -->


