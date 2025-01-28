# Configuring GitLab

## Pre-requisites

- [Node.js v20.18.0 or later](https://nodejs.org/en/download)
- [AWS Cloud Development Kit (CDK) v2](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- Configured AWS CLI credentials with access to source AWS account
- [Terraform 1.9.5 or later](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
- [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

## GitLab

This section will focus on the steps necessary to get GitLab CI/CD configured to be able to deploy resources on AWS. For the purposes of this workshop, it is going to be assumed that either a standalone GitLab instance is already configured and available to be used, or one can configure a free SaaS account at GitLab.com.

![[tfcicd-oidc.png]](./images/tfcicd-oidc.png)

### GitLab SaaS with OIDC

This process allows you to securely deploy infrastructure and apps to multiple AWS accounts from your GitLab CI/CD, without having to store long lived AWS credentials in GitLab. The OIDC integration handles authenticating your pipelines to AWS and assuming the right role for each environment.

We will start with configuring a free account on GitLab.com and then show the differences necessary to configure roles to be used with an standalone GitLab system.

![[tfcicd-gitlab-overview.png]](./images/tfcicd-gitlab-overview.png)

https://about.gitlab.com/pricing/

Create an account with GitLab and then create a project

![[tfcicd-project.png]](./images/tfcicd-project.png)

An easy way to connect into GitLab is adding an SSH key to your to profile so that you don't need to use a password to authenticate every time. To do so, follow these [instructions](https://docs.gitlab.com/ee/user/ssh.html)

- Clone or fork the repo from Github. We will be using terraform locally to setup GitLab in the following steps
- Navigate to the gitlab-terraform-setup/devops_account directory
- We will use terraform to setup an OIDC connection to a shared devops account. For additional context, please see this [documentation](https://docs.gitlab.com/ee/ci/cloud_services/aws/) What this process is going to create is an OpenID Connect identity provider in this account, a role with policies that can assume other roles in whatever SDLC accounts (i.e. develop, stage, prod) you would like to use for this process.

#### Steps for setting up devops account:

- Modify the devops.tfvars file to account for your specific repository as well as adding the roles that a new role will be able to assume. We are going to create these roles in a future step but for the moment, we just need the account numbers of the accounts that will be used. The configuration below will secure the GitLab connection to be used specifically via the gitlab repo on the specified brances of develop, stage, and prod.

```devops.tfvars
aws_region = "us-east-1"
match_field = "aud"
repo_value = "{{YOUR_PROJECT_NAME_HERE}}/{{YOUR_REPO_HERE}}"
aud_value   = "https://gitlab.example.com"
sdlc_roles  = [
"arn:aws:iam::{{DEVELOP_ACCOUNT}}:role/GitLabCI_WorkshopDeploymentRole",
"arn:aws:iam::{{STAGE_ACCOUNT}}:role/GitLabCI_WorkshopDeploymentRole",
"arn:aws:iam::{{PROD_ACCOUNT}}:role/GitLabCI_WorkshopDeploymentRole"
]
```

- The repo_value in the devops.tfvars should be what is after https://gitlab.com/ in your Gitlab URL.
- Validate that you have a version of Terraform at least at 1.9. Instructions for installing Terraform are located [here](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).
- [Set up your AWS credentials for the environment](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and export them into the environment so that you can run Terraform locally.
- Run terraform init, plan, and apply using the devops.tfvars file as input as shown below. After the apply, save the output of the DEVOPS_ROLE_ARN as we will need it to configure the assume policy on the deployment roles.

```
cd gitlab-terraform-setup/devops_account
terraform init
terraform plan -var-file devops.tfvars
terraform apply -var-file devops.tfvars
```

### Steps for setting up SDLC account(s):

The next steps will need to be repeated for all accounts that you wish to provision as SDLC accounts

- Navigate to the gitlab-terraform-setup/sdlc_accounts directory
- configure the tf.tfvars file adding in the DEVOPS_ROLE_ARN that was output in the previous step

```
aws_region = "us-east-1"
devops_role_arn = ["DEVOPS_ROLE_ARN"]
```

- export your credentials into the environment
- run terraform init, plan, and apply using the tfvars file as input

```
cd gitlab-terraform-setup/sdlc_accounts
terraform init
terraform plan -var-file tf.tfvars
terraform apply -var-file tf.tfvars
```

> [!IMPORTANT]
> If configuring multiple accounts, delete the terraform.tfstate file that will be created into your sdlc_accounts folder before moving onto the next one.

### Creating Gitlab static environments

- Create your Gitlab environments [in the UI](https://docs.gitlab.com/ee/ci/environments/#create-a-static-environment). This pattern uses dev, stage, and prod, however these can be modified to add more, use less, or change the names.

### Adding GitLab CICD variables into settings

We now need to add variables into GitLab that will automatically be inserted into the environment when our pipelines run.

- After logging into your GitLab account, Navigate to Settings > CI/CD

![[tfcicd-settings.png]](./images/tfcicd-settings.png)

- Expand the Variables section so that we can add in variables necessary for this solution. The variables added here will automatically be injected into the environments when the pipelines are running.

> [!IMPORTANT]
> A critical step is to uncheck the Protect variable flag when we are adding in the variables. If it is not checked the variables will NOT be passed into your develop and stage accounts

- Add in DEVOPS_ROLE_ARN with the value being the arn output from the devops configuration section

![[tfcicd-variables.png]](./images/tfcicd-variables.png)

- Add in OIDC with the value being true if you are using GitLab.com with OIDC and false if you are using a standalone version
    - Add in AWS_PROFILE with the value being oidc if OIDC is set to true
- Add in AWS_DEFAULT_REGION with the value being us-east-1
- Add in TF_VAR_capability_id with the value being acme. This is a namespace prefix that helps organize related microservices by grouping them together.
- Add in TF_VAR_ivr_id with the value being gitlabdemo. This is used in the Amazon Connect instance name.  In the future this could be used to support mutiple contact center instances in the same region.
- For every SDLC account configured we need to add an AWS_CREDS_TARGET_ROLE AND lock it to the correct environment. These will be the values we added into the SDLC accounts section. For the develop branch, our environment is dev, For staging it is stg, and for main it is prod. Please refer to the following images.

![[tfcicd-var2.png]](./images/tfcicd-var2.png)

![[tfcicd-var3.png]](./images/tfcicd-var3.png)

![[tfcicd-var4.png]](./images/tfcicd-var4.png)

At the end of this step, the CICD variables should look like the following image. Note that you should only see Expanded under the name and not Protected. If you see protected, edit the variable and uncheck the protect variable field otherwise the pipeline will not be able to see the variables within branches other than main.

![[tfcicd-var5.png]](./images/tfcicd-var5.png)

### Testing the solution

- Clone your GitLab repo to your local machine.  This will be empty.
- Copy the downloaded repository contents from GitHub into new GitLab repo.
- Add the files, commit them, and perform a git push up to the repo.

```
git add .
git commit -m "test"
git push origin main
```

In the GitLab console, navigate to Build > Pipelines and select the correct job.

![[tfcicd-pl1.png]](./images/tfcicd-pl1.png)

Double click into the assume-role-test, if successful, it should look similar to the image below where you see the devops account assumed, and then the develop account assumed.

![[tfcicd-tfsetup.png]](./images/tfcicd-tfsetup.png)

### Configuring Gitlab self-hosted runners using AWS Codebuild

The configuration described above showed how you can use Gitlab with the free tier of runner minutes, however you can also use self hosted runners using AWS codebuild. To do so you will need to [create a Gitlab connection](https://docs.aws.amazon.com/codebuild/latest/userguide/access-tokens-gitlab-overview.html#connections-gitlab) which authenticates a repository to AWS to use certain services such as Codebuild. [Next follow the steps in this tutorial](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-gitlab-runners.html) to create a codebuild project and update the CI file. The CI files are already set up to start using codebuild with the tagging statements already included, you will just need to replace the << YOUR CODEBUILD PROJECT NAME >> with the name of your codebuild project. Also these lines are commented out by default, so that one can immediately use the Gitlab provided runners.

### Configuring SDLC roles for use with standalone GitLab system

This section details the steps necessary to deploy when using an internal standalone GitLab instance. If using OIDC, these steps can be ignored.

If this solution is being used with a standalone version of GitLab, it is assumed that there is already an existing devops account configured for use that takes the place of the account configured from the devops_account section. Work with your GitLab admins to get the arn of that role and add it in place of the DEVOPS_ROLE_ARN in the SDLC instructions. There might be additional configurations (i.e. conditions) that are necessary to add to the assume role policy so that it will work within your environment.

We still need to create the GitLab variables as specified in the OIDC section above, however, we will not need the AWS_PROFILE variable.

#### Additional Resources about OIDC and GitLab

This Youtube link is a great video on securing GitLab CI/CD with OIDC
https://www.youtube.com/watch?v=xWQGADDVn8g

The section on using OIDC with GitLab is a modified version of the content located in this blog. Please check it out. - https://aws.amazon.com/blogs/apn/setting-up-openid-connect-with-gitlab-ci-cd-to-provide-secure-access-to-environments-in-aws-accounts/