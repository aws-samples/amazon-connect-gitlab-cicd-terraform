# Configure OpenID Connect (OIDC) between AWS and GitLab


## Use-cases
* Retrieve temporary credentials from AWS to access cloud services
* Use credentials to retrieve secrets or deploy to an environment
* Scope role to branch or project

For additional details, see [documentation here](https://docs.gitlab.com/ee/ci/cloud_services/aws/)

[!NOTE] This section is a modified version of the content located in this blog - https://aws.amazon.com/blogs/apn/setting-up-openid-connect-with-gitlab-ci-cd-to-provide-secure-access-to-environments-in-aws-accounts/


## Steps
1. Fork or clone this project into your GitLab environment. Continue to follow the [AWS documentation](https://docs.gitlab.com/ee/ci/cloud_services/aws/) to configure the connection between AWS and GitLab.

1. Run terraform locally to provision AWS resources. For this demonstration, we are going to create an identity provider in IAM, a role with policy attached that allows it to assume roles in SDLC accounts, and assume policy that will determine which GitLab project can access these resources.

1. Add a `devops.tfvars` file with your gitlab_url, [aud value, and match value](https://docs.gitlab.com/ee/ci/cloud_services/#configure-a-conditional-role-with-oidc-claims).
    This example would allow any project in the `mygroup` group running a job for the `main` branch.
    ```
    aws_region      = "us-east-1"
    gitlab_url      = "https://gitlab.example.com"
    aud_value       = "https://gitlab.example.com"
    match_field     = "aud"
    match_value     = ["project_path:mygroup/*:ref_type:branch:ref:main"]
    ```
1.  Run terraform init, plan, and apply. Now that the AWS resources are provisioned, we will now setup the variables in the GitLab project.
1.  Set the AWS_CREDS_TARGET_ROLE variable in the GitLab Project (Settings->CI/CD->Variables). This value is generated as output after `terraform apply` is run.
1.  Set the AWS_DEFAULT_REGION variable in the GitLab Project (Settings->CI/CD->Variables).
1.  Set AWS_PROFILE variable in the GitLab Project (Settings -> CI/CD->Variables) to "oidc". [AWS will call STS on our behalf](https://docs.aws.amazon.com/cli/latest/topic/config-vars.html#assume-role-with-web-identity) within the `before_script`.
1.  Our assume role function will fetch temporary STS credentials in the before_script. Within the script, we will test which resources are retrievable. As we only provisioned access to S3, we should receive a success on S3 list calls and failure on EC2 calls. 
1. `MY_OIDC_TOKEN` is an id_token that can be configured. The aud value should be a url descriptive to your service or application. 


## Resources

- https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html
- https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html
- https://docs.aws.amazon.com/cli/latest/topic/config-vars.html#assume-role-with-web-identity 

<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | >= 4.26 |
| <a name="requirement_tls"></a> [tls](#requirement\_tls) | >= 4.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | >= 4.26 |
| <a name="provider_tls"></a> [tls](#provider\_tls) | >= 4.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_iam_openid_connect_provider.gitlab](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_openid_connect_provider) | resource |
| [aws_iam_policy.sts_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_policy) | resource |
| [aws_iam_role.gitlab_ci](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_policy_document.assume-role-policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [tls_certificate.gitlab](https://registry.terraform.io/providers/hashicorp/tls/latest/docs/data-sources/certificate) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aud_value"></a> [aud\_value](#input\_aud\_value) | n/a | `string` | `"https://gitlab.example.com"` | no |
| <a name="input_aws_region"></a> [aws\_region](#input\_aws\_region) | n/a | `string` | n/a | yes |
| <a name="input_gitlab_tls_url"></a> [gitlab\_tls\_url](#input\_gitlab\_tls\_url) | n/a | `string` | `"tls://gitlab.com:443"` | no |
| <a name="input_gitlab_url"></a> [gitlab\_url](#input\_gitlab\_url) | n/a | `string` | `"https://gitlab.com"` | no |
| <a name="input_match_field"></a> [match\_field](#input\_match\_field) | n/a | `string` | `""` | no |
| <a name="input_repo_value"></a> [repo\_value](#input\_repo\_value) | The value of the Gitlab ID and repo. Ex. myname/myrepo | `string` | `""` | no |
| <a name="input_sdlc_roles"></a> [sdlc\_roles](#input\_sdlc\_roles) | n/a | `list(any)` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_ROLE_ARN"></a> [ROLE\_ARN](#output\_ROLE\_ARN) | Role that needs to be assumed by GitLab CI. We will use this as a GitLab CI Variable |
<!-- END_TF_DOCS -->