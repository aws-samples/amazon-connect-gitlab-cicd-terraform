# Amazon Connect DevOps using Terraform and GitLab - New and Re-Architected Version

## What's New in This Guide

The original Amazon Connect CI/CD workshop has been revamped to create a more comprehensive, structured, and user-friendly implementation experience. Key improvements include:

- **Clearer Architecture Layout**: Enhanced documentation of the five core pipelines (connect-instance, admin-objects, supporting-infra, lambdas, and contact-flows) with improved diagrams and explanations
- **New Export Utility Documentation**: Added detailed coverage of the AWS CCaaS Export Utility, making it easier to export and migrate existing Connect configurations
- **Enhanced Security Guidance**: Added important security notes and best practices for production implementations
- **Streamlined Configuration Steps**: Reorganized the GitLab setup process with clearer prerequisites and step-by-step instructions
- **Environment-Specific Configurations**: New section on handling outbound caller ID mappings across different environments
- **Improved Testing Instructions**: More detailed validation steps with screenshots and expected outcomes

This guide now serves as a complete reference for implementing a CI/CD pipeline for Amazon Connect using GitLab. Whether you're building a new contact center or migrating an existing one, you'll find detailed instructions for automating deployments while maintaining security and scalability across multiple environments.

The restructured content follows a logical progression from initial setup through testing and cleanup, making it easier to implement the solution in phases. We've also added practical tips and important notes throughout to help you avoid common pitfalls during implementation.

Let's begin by looking at the solution ...

# Overview

This workshop uses GitLab CI/CD for CI/CD and build processes. Terraform is used to deploy Amazon Connect as well as other associated components. The Lambda function code is written in Typescript. This solution has Multi-Region support and will also natively work with [Amazon Connect Global Resiliency](https://docs.aws.amazon.com/connect/latest/adminguide/setup-connect-global-resiliency.html).

## CI/CD Architecture

The pipelines that deploy Amazon Connect and other associated infrastructure will run in GitLab CI/CD. Terraform will assume a role in the SDLC (i.e. develop, stage, main) accounts and provision resources directly into them. Each of the pipelines is set up in a matrix format to deploy to both us-east-1 and us-west-2 (although any pair of regions that [supports](https://docs.aws.amazon.com/connect/latest/adminguide/regions.html) Amazon Connect will work). GitLab itself can be setup to be used with a standalone instance that exists already or by using the free tier of GitLab.com

> [!NOTE]
> While this code sample highlights how to use GitLab CICD with OIDC, a similar architecture could be achieved using [Github Actions with OIDC as well](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

![[tfcicd-gitlab.png]](./docs/ReferenceImplementation/images/tfcicd-gitlab.png)

There will be five pipelines deployed

- amzconnect-instance pipeline which creates the Amazon Connect instance itself.
- amzconnect-admin-objects which will create items that live within Connect such as users, queues, hours of operations, and profiles
- amzconnect-supporting-infra pipeline which creates supporting architectures such as a lex v2 bot, s3 buckets, and any other resource which is not primarily code.
- amzconnect-lambdas pipeline which creates all associated lambda functions and layers. This is separate so that appropriate testing and security patterns can be run against the code itself.
- amzconnect-contact-flows pipeline which deploys the Amazon Connect contact flows themselves to the instance.

![[tfcicd-pipelines.png]](./docs/ReferenceImplementation/images/tfcicd-pipelines.png)

The code exists in a monorepo with folders for each of the pipelines as well a folder which contains terraform code to get the accounts set up initially.

## Table of Contents

- Reference implementation
  - [Overview](<docs/ReferenceImplementation/01 Overview.md>)
  - [Configuring GitLab](<docs/ReferenceImplementation/02 Configuring GitLab.md>)
  - [Running the Pipelines](<docs/ReferenceImplementation/03 Running the Pipelines.md>)
  - [Export Utility](<docs/ReferenceImplementation/04 Export Utility.md>)
  - [Cleanup](<docs/ReferenceImplementation/05 Cleanup.md>)
  - [Conclusion](<docs/ReferenceImplementation/06 Conclusion.md>)
- DevOps Best Practices
  - [Recommendations](docs/BestPractices/Recommendations.md)
