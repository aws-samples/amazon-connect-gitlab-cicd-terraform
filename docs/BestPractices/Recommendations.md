## DevOps recommendations for Amazon Connect projects:

The following are recommended Amazon Connect DevOps practices derived from our own DevOps well architected framework, and the deployment pipeline reference architecture. These are modern and widely accepted industry practices that foster automation, orchestration, consistency, always deployable code, and fast feedback among others. These practices also shape the branching strategy, code promotion, and ci/cd pipeline strategies for Amazon Connect projects.

References:
- [AWS Deployment Pipeline Reference Architecture](https://pipelines.devops.aws.dev/#business-outcomes)
- [AWS DevOps Guidance](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/devops-guidance.html)
- [AWS Builders Library](https://aws.amazon.com/builders-library/cicd-pipeline/)

## Table of contents
- [Key recommendations](#key-recommendations)
- [Project organization](#project-organizationstructure)
- [Collaboration- branching strategies](#collaboration--branching-strategies)
- [Environment considerations](#environment-considerations)
- [Code promotion process](#code-promotion-process)
- [Developer workflow](#developer-workflow)
- [Key metrics to track](#key-metrics-to-track)
- [Other considerations](#other-considerations)


---
### Key recommendations

* Everything as code (AWS infrastructure, Connect configurations, pipeline configurations, contact flows, etc.). Insist in automating as much as possible. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/indicators-for-everything-as-code.html)

* Use version control for all your code assets (including contact flows, configuration data, etc.). [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.scm.1-use-a-version-control-system-with-appropriate-access-management.html)

* Test (unit, integration) and validate (lint, cdk nag, checkov) your code before and after deployment. Invest in integration and IVR testing. Adopt Test Driven Development(TDD). [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ci.3-ensure-automated-quality-assurance-for-every-build.html)

* Changes should be managed through a CI/CD pipeline. Don’t allow manual changes in the AWS console for developer and operation profiles. Allow minimum changes (e.g., editing HOOs) in the Connect admin console for QA activities, for example. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-everything-as-code.html)

* Practice Test-Driven-Development, ensure code committed includes testing (IaC, Lambda, Step Functions, etc.). [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ci.1-integrate-code-changes-regularly-and-frequently.html)

* Deploy to prod often. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.cd.1-deploy-changes-to-production-frequently.html)

* Incorporate security validations in your pipelines (SAST, vulnerability scanning, DAST, etc.). [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/indicators-for-security-testing.html)

* Practice continuous integration and delivery. Integrate often (e.g. once/day), and always have a prod deployable artifact you can create from your version control system. [CI Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/continuous-integration.html), [CD Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/continuous-delivery.html)

* Reduce your actively working branches to a minimum, avoid long-lived branches. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.scm.2-keep-feature-branches-short-lived.html)

* Dark launch your finished features. Decouple deployments from releases to reduce risk. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ads.4-implement-incremental-feature-release-techniques.html)

* Promote your unfinished features/changes throughout environments (dev, uat, prod), keeping them dormant until the feature is complete. Use techniques such as branching by abstraction for unfinished features. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ci.1-integrate-code-changes-regularly-and-frequently.html)

* Break development tasks into small chunks. For example, ones you can complete in 1-2 days. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ci.1-integrate-code-changes-regularly-and-frequently.html), [TF Ref](https://developer.hashicorp.com/well-architected-framework/operational-excellence/operational-excellence-automate-infrastructure#deploy-atomic-infrastructure-components)

* Implement automatic rollbacks for failed deployments. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ads.2-implement-automatic-rollbacks-for-failed-deployments.html)


---
### Project organization/structure
Many version control systems (VCS) organize code in groups, subgroups and projects. In contact center projects groups represent the name of the overall project (in a folder structure, this is akin to the name of the root folder), e.g. Contact Center. Groups are also the place where you configure the project overall security settings, merge rules, CI/CD group variables, etc. Subgroups are akin to subfolders, where you can further organize code. Projects represent individual code repositories. Group your projects by functionality.

#### Code Organization
* Contact Center (group)
    * Modules (subgroup)
        * Module 1 (project)
        * Module N
    * LOBs (subgroup)
        * LOB 1 (project)
        * LOB N
    * Microservice/common components (subgroup)
        * Microservice 1 (project)
        * Microservice 2

Each propject will contain one to all of these folder to support each pipeline type.  See [Reference Implementation](<../ReferenceImplementation/01 Overview.md#cicd-architecture>) documentation for details.  
* amzconnect-instance
* amzconnect-admin-objects
* amzconnect-supporting-infra code
* amzconnect-lambdas
* amzconnect-contact-flows  

It’s a good practice to separate configuration data from the code. For example, define specific configurations files (variables, csv, yaml files, etc.), and pass them to reusable modules/constructs.  The reference implemenation has an [Export Utility](<../ReferenceImplementation/04 Export Utility.md>) that can be used to manage contact flows and admin objects.  

Use modules or constructs to raise the level of abstraction of the IaC you are writing. For example, having modules that create Amazon Connect instances, configurations, and contact flows will not only allow you to reuse these functionalities as your implementation scales, but it will provide consistency across multiple deployments, and a centralized place to iterate on those resources as Amazon Connect releases new capabilities. [Ref](https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/structure.html#modularity)

The following is an example project structure in version control (root module in terraform) Ref:

![Project Structure](./images/project-structure.png)

---
### Collaboration- branching strategies
Lead with trunk-based development paired with a pull request workflow [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.scm.2-keep-feature-branches-short-lived.html), [TF Ref](https://developer.hashicorp.com/terraform/language/style#branching-strategy).  

Whether you are using a monorepo or separate repos, use a git branching strategy such as trunk-based development, which allows for continuous integration. Continuous integration encourages the development of features in small batches that are integrated into trunk/main at least once a day. Once changes are tested and merged into main, they can be deployed into any environment. Practicing continuous integration prioritizes group over individual productivity.

Integrating changes in small batches also streamlines the troubleshooting process in case of issues (test, build, deploy stages). This may block the rest of the development team temporarily if someone introduces breaking changes, but everyone will work off the same trunk, reducing the changes of merge conflicts. The longer your branches are active, the higher the likelihood is of running into complex merge conflicts. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-continuous-delivery.html)

Use techniques such as feature flags or branching by abstraction when changes or features can’t be completed quickly, allowing you to still integrate your code to main. Introducing these partially completed features must not break the build/test phase, and will allow you to work on the trunk, while allowing others to collaborate on the same branch without conflicts. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ci.1-integrate-code-changes-regularly-and-frequently.html)

Trunk-based development requires having an automated testing strategy in place for your code, in addition to practicing Test Driven Development ([Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ci.1-integrate-code-changes-regularly-and-frequently.html)). This may be one reason to use a different strategy for contact flows early in the project (since it requires third-party tools for testing, and additional budget/time). Long term, however, and once the tooling is in place, trunk based development should be adopted.

Once code validation and automated testing pass as your code progresses through environments, you will have high confidence your development changes will make it to production safely.

---
### Environment considerations

In an Amazon Connect implementation, environments represent the stages in which the code and infrastructure developed are deployed, from development to production. When discussing environments, we refer to a collection of resources, configuration, and infrastructure (such as an Amazon Connect instance, configurations, AWS services, microservices, etc.) deployed in multiple AWS accounts. Separate environments by AWS accounts in a 1:1 mapping (e.g. dev environment deployed in the dev AWS account). This allows you to establish natural trust boundaries between environments where you can apply different account and access policies.
 
#### The following environments are common:

* Sandbox: an environment for developers to experiment and prototype features in AWS and the Amazon Connect consoles. 
* Development (DEV): this is where the code is first validated, unit tested, built and deployed. 
* System integration testing (SIT): besides the code being validated, this environment is used for integration testing.
* User integration testing/staging (UAT): end-to-end and optionally load testing happen in this environment. User acceptance or QA teams have access to this environment to perform additional manual testing to validate the full functionality of a feature/release.
* Production (PRD): where production workloads run. Like UAT, integration and end-to-end testing runs here after a deployment.

With the exception of the sandbox environment, restrict developer access to the AWS and Amazon Connect console to read/view only. Changes to environments have to be executed through the CI/CD pipeline and from the VCS. This allows maintaining a single source of truth, driving change process consistency, and avoiding environment drift.


#### Working in the sandbox environment:

In this environment, developers use the console to configure AWS services and Amazon Connect for fast experimentation and feature prototyping. Once they test a feature works in this environment, they commit their changes in code to the DEV environment through a merge request. This applies to AWS services (S3, Lambda, Step functions, Kinesis streams, etc.), or any of the work devs complete through the AWS console. Certain Amazon Connect configurations, like contact flows, modules, views, contact lens rules, and contact evaluations, need to be exported from the sandbox instance and committed as code in a merge request for the DEV environment.


---
### Code promotion process

Adhere to the build once deploy many principle ([Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-continuous-delivery.html)). This means using the main branch (trunk) for your deployments. Your project should represent the environments where your code will be deployed (see the previous project structure example). Avoid the practice of creating a repository or branch per environment, as this adds complexity to the code promotion process (moving code across repos or folders, merging conflicts, etc). Instead, define environment specific variables in variable/configuration files or in your pipeline UI configuration, which defines how your infrastructure and configurations should be applied per environment.

Use your CI/CD pipeline to build your code from your VCS solution, test it, and deploy it in a lower environment, before merging it to main and deploying it to an upper environment. Avoid patterns that mirror configurations from one environment to the next. Use version control as your source of truth for the project assets. [Ref](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/everything-as-code.html) 


---
### CI/CD Pipelines design

Your CI/CD pipelines should implement the practices discussed above to integrate code continuously (into main/trunk), and to ensure code is ready to deploy to prod (or any environment). The pipeline design should be optimized to provide feedback to developers as early as possible in the development process.

Consider the following pipeline types to avoid merge conflicts as multiple developers work simultaneously, and to ensure no breaking changes happen as code is merged to main.


#### Merge request pipelines: 

This pipeline validates that changes have proper syntax, style, are secure, include tests, and can be built in the development environment. It’s triggered when developers complete code tasks/assignments locally in their workstation, commit their code to the VCS server, and create a merge request. It also provides a mechanism for developers to test iterations of their code without deploying to any environment or conflicting with other developers. This workflow follows the speculative plan concept describe [here](https://developer.hashicorp.com/terraform/cloud-docs/run/remote-operations#speculative-plans).

The pipeline triggers a code review, approval to merge code to main, and should run the following stages and jobs at a minimum:

* Dev validation
    * Syntax validation (tf validate for terraform)
    * Code linting, code style validation (tflint for terraform, eslint for ts)
    * Static code analysis (checkov, cdk nag for IaC, semgrep for Node and Python, etc.)
    * Dependency and vulnerability checks (for Lambda function pipelines)
    * Code coverage (for Lambda function code)
* Dev build
    * Unit testing (tf tests for terraform)
    * Perform the code build (tf plan, cdk synth)

As this pipeline runs, keep the code committed to the merge request updated with the latest contents of main to avoid merge conflicts. You accomplish this by rebasing before creating the merge request. 

3rd party CI/CD tools such as GitLab offer an equivalent functionality called **“merged results pipelines”**, which combine the merge request with the current contents of the target branch (main) before merging the code. Use this functionality if available.
Once this pipeline finishes, the code reviewer approves the merge request and merges to main. Ensure the approved profiles can merge code to main, and the approval and merge options are available only after a successful pipeline run.


#### Merge train/merge queue pipelines (recommended):

Triggered right after the merge request is set to merge to trunk, but before merging to main. This pipeline type (available in GitLab and GitHub) allows multiple merge requests to be queued in the order in which they were merged to the destination branch (main). To ensure multiple changes to the destination branch are compatible, the queue merges successive changes together, for example if merge requests A and B were added to the queue in this order, the pipeline will run with A changes only, however, B will include the changes in A and will run the pipeline (only if the pipeline run by A was successful).

Once the pipeline jobs complete successfully, the code is automatically merged to the destination branch.
This pipeline should run the following jobs in the lowest environment (usually dev):

* Dev validation
    * Unit testing
* Dev deployment
    * Perform the code build (tf plan, cdk diff)
    * Deploy the code in the lowest environment
    * Run integration testing (IaC and other functionality, such as Lambda functions)

This pipeline type is useful when the main branch is busy, or there are multiple developers constantly merging code to this branch.

#### Code push pipeline:

This pipeline triggers once the code is finally merged to main after being deployed and tested in the dev environment. It triggers automatically as the previous pipeline merges code to main. Main should be a protected branch, and committing directly to it should not be allowed.
This pipeline should run the following stages and jobs in the next environments in sequence (e.g. SIT, UAT/Staging, Prod):

* <env> Validation
    * Unit testing
* <env> Deployment
    * Perform the code build in dev (tf plan, cdk diff)
    * Deploy the code in dev
    * Run automated integration testing (IaC and other functionality, such as Lambda functions)
    * Run automated user acceptance testing (Staging)

In Prod environments, the validation and deployment stages can be set to run manually, giving more control to when a specific change is deployed based on a deployment window. In addition, we recommend to protect the production environment, so that only the approved users can deploy to that environment. 

With the right testing stages and jobs in place as described above, deploying often, and during normal business hours should bring no significant risks to the operations. 


---
### Developer workflow

Use the following workflow in combination with your pipelines as you are developing new features:

* Branch from main
* Commit your changes 
* Create a merge request, this will trigger a merge request (or merge results pipeline, as explained above) pipeline
* Once completed, the MR will be reviewed, approved, and merged to main. If using the merge train/merge queue functionality, the merge request will be combined with other merge requests previously added to the queue, and another pipeline will run. This pipeline will deploy the code to DEV. The code will be merged to main after this operation completes.
* Once the code is merged to main, another pipeline will kick off (code push pipeline) that will deploy the code from main to the rest of environments. We recommend running integration testing in throughout environments as code is deployed.
* If the pipeline breaks the deployment, the development team should swarm the problem until it’s fixed.


---
### Key Metrics to Track

As your DevOps processes mature, consider these metrics to measure the effectiveness of the processes you implemented. These metrics define the success of your DevOps strategy, and are usually available in the VCS solution you are using, specially if they are integrated with project management software (e.g. Jira). 
* Operational Metrics:
  - Deployment frequency
  - Change lead time
  - Change failure rate
  - Mean Time to Recovery (MTTR)


---
### Other considerations

* Code repository and CI/CD solution settings:
    * Branch protection: protect the main branch so it only allows merges from the developer group, and merges and pushes from allowed profiles.
    * Implement merge request approvals: create merge approval rules, so merge requests are approved and reviewed by authorized individuals.
    * Implement branch name patterns: this ensures the branch naming convention is consistent.
    * CI/CD variables: 
        * Define CI/CD variables in a hierarchical way that follows the group and subgroup model. For example if all contact center resources should have the same AWS tags assigned, you can define a CI/CD variable at the root group level so that subgroups and project inherit them.
        * Use CI/CD variables to simplify and protect the variable assignment process. For example, the AWS account number variable per will likely remain static for the duration of the project. Define these at the group level and ensure they are protected. Your projects can then inherit them and ensure they won’t accidentally change.
    * Environment protection: protect environments such as “Production”, so only approved profiles can approve and execute deployments in this environment. In addition, you can implement deployment freezes, so that deployments to protected environments can only happen during a predefined time window.


* IAM Pipeline role:
    * One strategy to consider is creating a [permissions boundary](https://docs.aws.amazon.com/prescriptive-guidance/latest/transitioning-to-multiple-aws-accounts/creating-a-permissions-boundary.html) policy with restrictions that the pipeline role needs to have, then create a more broad permissions policy and attach the permissions policy defined. The policy must include restrictions on the roles the pipeline role creates, so they too attach the permissions boundary policy.


