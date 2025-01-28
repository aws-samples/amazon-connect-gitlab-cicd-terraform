# Overview

This workshop uses GitLab CI/CD for CI/CD and build processes. Terraform is used to deploy Amazon Connect as well as other associated components. The Lambda function code is written in Typescript. This solution has Multi-Region support and will also natively work with [Amazon Connect Global Resiliency](https://docs.aws.amazon.com/connect/latest/adminguide/setup-connect-global-resiliency.html).

## CI/CD Architecture

The pipelines that deploy Amazon Connect and other associated infrastructure will run in GitLab CI/CD. Terraform will assume a role in the SDLC (i.e. develop, stage, main) accounts and provision resources directly into them. Each of the pipelines is set up in a matrix format to deploy to both us-east-1 and us-west-2 (although any pair of regions that [supports](https://docs.aws.amazon.com/connect/latest/adminguide/regions.html) Amazon Connect will work). GitLab itself can be setup to be used with a standalone instance that exists already or by using the free tier of GitLab.com

> [!NOTE]
> While this code sample highlights how to use GitLab CICD with OIDC, a similar architecture could be achieved using [Github Actions with OIDC as well](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

![[tfcicd-gitlab.png]](./images/tfcicd-gitlab.png)

There will be five pipelines deployed

- amzconnect-instance pipeline which creates the Amazon Connect instance itself.
- amzconnect-admin-objects which will create items that live within Connect such as users, queues, hours of operations, and profiles
- amzconnect-supporting-infra pipeline which creates supporting architectures such as a lex v2 bot, s3 buckets, and any other resource which is not primarily code.
- amzconnect-lambdas pipeline which creates all associated lambda functions and layers. This is separate so that appropriate testing and security patterns can be run against the code itself.
- amzconnect-contact-flows pipeline which deploys the Amazon Connect contact flows themselves to the instance.

![[tfcicd-pipelines.png]](./images/tfcicd-pipelines.png)

The code exists in a monorepo with folders for each of the pipelines as well a folder which contains terraform code to get the accounts set up initially.

## Amazon Connect Flows

In [Amazon Connect](https://aws.amazon.com/connect/) deployments it is common to deploy [Amazon Connect Flows](https://docs.aws.amazon.com/connect/latest/adminguide/connect-contact-flows.html)  that are created using the Amazon Connect console using various [flow block components](https://docs.aws.amazon.com/connect/latest/adminguide/contact-block-definitions.html)  These flows will define the entire user experience from end to end. The resources referred to in the flow, such as queues, voice prompts, lex bots, and lambda functions when set manually by the name of the resource are saved as an Amazon Resource Name (ARN). The ARN is a unique identifier for a resource that is specific to the service and region in which the resource is created. When flows need to be moved to different Amazon Connect instances in other accounts or regions, the ARNs will no longer accurately reference the required resources. If the resource names are identical in both locations the mappings may still work, however, if the names differ, the flows will break and must be manually updated with new ARNs for each resource. This does not scale well and risks human error.

This design can use [Amazon Connect contact attributes](https://docs.aws.amazon.com/connect/latest/adminguide/connect-contact-attributes.html) to refer to Amazon Connect resources dynamically instead of manually setting a reference which is then translated to the ARNs themselves. These flow based contact attributes act as indirect references to the resources and are injected into a set contact attributes block in each of the flows that need them during the deployment process.

This is an Amazon Lex bot example using dynamic refrences:

![[tfcicd-lex.png]](./images/tfcicd-lex.png)

This is a Set working queue example:

![[tfcicd-queue.png]](./images/tfcicd-queue.png)

To get the contact attributes injected into the flow, a 'Set contact attributes' is added to the beginning of the flow looking similar to the below image. The important components are to set the name of the object to "FLOW_OBJECT_MAPS#" and to set up a single dummy flow attribute. The key and value of the attribute do not matter here as it will be replaced with the actual objects during the flow deployment.

![[tfcicd-ca.png]](./images/tfcicd-ca.png)

This design can also handle contact flows that were built by statically referring to the resource. The way we get around the issue of moving contact flows with statically inserted ARNs between instances is by using an included utility which will export and parameterize the contact flows and contact flow modules. When the flow is redeployed it is populated with the correct ARNs.

Once the contact flows are built and published, the developer will use the export utility to export them from the system. This tool also will export all other Amazon Connect objects such as queues, routing profiles, security profiles, etc., The specific instructions on how to perform the export are in a later section. Listed below is an example of an exported contact flow.

```
{
  "Name": "acme_agent_whisper_AUTO",
  "Type": "AGENT_WHISPER",
  "Content": "{\"Version\":\"2019-10-30\",\"StartAction\":\"73611771-2716-4560-afb3-bae51560752c\",\"Metadata\":{\"entryPointPosition\":{\"x\":70,\"y\":115},\"ActionMetadata\":{\"ef747366-46cb-4d97-a096-dd34af2a807f\":{\"position\":{\"x\":579,\"y\":145}},\"73611771-2716-4560-afb3-bae51560752c\":{\"position\":{\"x\":256,\"y\":113},\"useDynamic\":false}}},\"Actions\":[{\"Identifier\":\"ef747366-46cb-4d97-a096-dd34af2a807f\",\"Parameters\":{},\"Transitions\":{},\"Type\":\"EndFlowExecution\"},{\"Identifier\":\"73611771-2716-4560-afb3-bae51560752c\",\"Parameters\":{\"Text\":\"$.Queue.Name\"},\"Transitions\":{\"NextAction\":\"ef747366-46cb-4d97-a096-dd34af2a807f\",\"Errors\":[],\"Conditions\":[]},\"Type\":\"MessageParticipant\"}]}",
  "Description": "Agent whisper flow for example pattern"
}
```

> [!NOTE]
> Please note that the code and configurations provided in this repository serve as a demonstration example to illustrate basic concepts and functionality around deploying services around Amazon Connect and Amazon Contact Flows specifically. While this implementation may be suitable for learning and development purposes, it's important to emphasize that in an enterprise or production environment, a more comprehensive security review would be essential. Organizations should conduct thorough security assessments, implement the principle of least privilege, and consider tightening IAM roles, permissions, and security policies.
>
> For enhanced security in production, consider implementing additional controls such as detailed audit and access logging, AWS CloudTrail for API monitoring, and regular security reviews. The permissions and roles defined in this example are intentionally broader to facilitate learning and may need to be scoped down significantly based on your specific use case and security requirements. We recommend consulting with your security team and following your organization's compliance requirements and best practices before deploying similar solutions in a production environment.
