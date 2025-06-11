# Cleanup

To clean up your resources, complete the following steps:

Go into each pipeline initiate a terraform destroy. Destroy the resources from the lambda pipeline first, followed by the supporting infra pipelines next. For the supporting infra pipeline you will manually need to empty/delete the buckets created first or it will not complete. After they are removed start the destroy job on the connect-instance pipeline and it will also destroy all components within the admin-objects and the contact-flows pipelines.

![[tfcicd-cleanup.png]](./images/tfcicd-cleanup.png)
If for some reason, the destroy will not run, try starting a new manual job by clicking the Run pipeline button.

![[tfcicd-clean2.png]](./images/tfcicd-clean2.png)

Presumably there will be no new changes to the plan/apply and then the destroy can run.

![[tfcicd-clean3.png]](./images/tfcicd-clean3.png)