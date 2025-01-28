# Running the Pipelines

## Running GitLab Pipelines

- We now have functional permissions connecting GitLab and AWS and can begin to deploy the Amazon Connect instance.
- If you wish to follow a standard SDLC deployment using develop, stage, and main branches, Create a new develop branch.

```cli
git checkout -b develop
```

- Otherwise, just continue on the main branch.
- Navigate to the .gitlab-ci.yaml file in the root directory and comment out the assume-role-test section and uncomment the remainder of gitlab-ci.yaml file.
- Add the files, commit them, and perform a git push up to the repo.```

```cli
git add .
git commit -m "initial"
git push origin develop
```

In the GitLab console, navigate to Build > Pipelines and select the running job
It should look similar to the image below (which has connect-instance expanded):

- ![[tfcicd-pl2.png]](./images/tfcicd-pl2.png)

- We will need to trigger the pipelines in the correct order which is:
  1. connect-instance
  1. supporting-infra
  1. workshop-lambda
  1. admin-objects
  1. contact-flows

The reason that four of the pipelines have failed is that they all reference an ssm parameter that is created by the connect instance pipeline.

## Connect-Instance

- First, examine the terraform files to see what is being provisioned
- GitLab can be used as a repository for [state files](https://docs.gitlab.com/ee/user/infrastructure/iac/terraform_state.html), so if we look at the backend.tf file we will see the configuration necessary.

```terraform
terraform {
  backend "http" {
  }
}
```

- If we look at the main.tf file, we can see that we are using a [terraform module](https://registry.terraform.io/modules/aws-ia/amazonconnect/aws/latest) that creates an Amazon Connect instance for us.
- The alias is comprised of various variables that are concatenated to form the name.
- The instance storage configurations are located in the instance_storage_configs.tf file and referenced within the module as a local variable
- The terraform will output the Amazon Connect instance ID into an [SSM parameter] . Downstream pipelines will reference this parameter as input to determine the target Connect instance for deploying contact flows, lex bots, lambdas, and other ancillary resources in later steps.

### Run Terraform Plan

- Expand connect-instance, select plan, and then select a region to look at what will be provisioned

![[tfcicd-pl8.png]](./images/tfcicd-pl8.png)

- You will see all of the resources to be provisioned from the code located within this particular folder. Towards bottom you should see:

![[tfcicd-plan.png]](./images/tfcicd-plan.png)

### Run Terraform Deploy

- Expand connect-instance, select deploy, and then click the play arrow for the region you wish to deploy first.

![[tfcicd-pl3.png]](./images/tfcicd-pl3.png)

At bottom of job page, you should see

![[tfcicd-apply.png]](./images/tfcicd-apply.png)

## Supporting-Infra

- This folder will deploy an artifact bucket for contact flows, configuration, as well as CICD artifacts for the lambda functions and Lex bots. It will also deploy the Lex V2 Bot and attach it to the Amazon Connect instance.
- All of the configuration for each of these components is kept in individually named files that have the local variables.
- Run Terraform Plan and Deploy exactly as we just did in the previous steps.

![[tfcicd-pl5.png]](./images/tfcicd-pl5.png)

## Workshop-Lambda

- This folder will deploy a single lambda function used within this workshop. It is merely an example "hello world" type function that demonstrates how to lay that out.
- The pipelines are slightly different in that we now have a build stage as well as a section where unit tests and other code coverage tests could be run.
- All of the configuration for each of these components is kept in individually named files that have the local variables.
- Run Terraform Plan and Deploy exactly as we just did in the previous steps.

![[tfcicd-pl6.png]](./images/tfcicd-pl6.png)

> [!IMPORTANT]
> This pattern contains code for resources that were exported using the export utility. The resource configurations for the next two pipelines reside under imports/ resources directory. To create additional resources one can either create them manually using the same format and store them within this folder structure or create them in the console and then use the export utility to export the resources. The instructions for using the Amazon Connect export utility will be covered at the end of this section.

## Admin-Objects

### Components

This deployment creates the following Connect admin objects:

- Hours of Operations
- Queues
- Quick Connects
- Routing Profiles
- Security Profiles
- Users
- Contact Lens Vocabularies (optional)
- Base contact flow for Queue Transfer referenced by Quick Connects
- Base contact flow for Outbound flows referenced by Queues

### Steps

1. Individual configurations must exist in imports/resources/{resource_type}/
2. Configuration files should be generated using the export tool (see Export Tool Documentation)
3. Run Terraform Plan and Deploy exactly as we just did in the previous steps.

### Manual Configuration Requirements

In contact_flows.tf, update the following arrays under locals if using:

- Outbound flows referenced by queues
- Queue transfer flows referenced by quick connects

> [!NOTE]
> While this guide attempts to show how the items above can be created using CI/CD, in reality users are most likely going to be implemented outside of Amazon Connect using an SSO federation. Also, a CI/CD pipeline might not be the best solution for updates to things that potentially change frequently.

> [!NOTE]
> This pattern creates agent statuses, however there is no currently method that deletes agent statuses. As such, when doing a terraform destroy this part will fail.

![[tfcicd-pl4.png]](./images/tfcicd-pl4.png)

## Contact-Flows

- This folder will deploy the actual contact flows to the Amazon Connect instance.
- All of the configuration for each of these components is kept in individually named files that are located under imports/resources/flows
- Run Terraform Plan and Deploy exactly as we just did in the previous steps.

![[tfcicd-pl7.png]](./images/tfcicd-pl7.png)

Congratulations! We should now have a working Amazon Connect instance with contact flows deployed!
