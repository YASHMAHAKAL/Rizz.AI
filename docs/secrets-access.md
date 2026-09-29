# Secrets, access and rotation

The staging backend reads `GEN_AI_KEY`, demo username/password and model from
runtime environment. Secret values belong in AWS Secrets Manager and are
synced by External Secrets; they must not enter Git, Terraform state,
Scaffolder parameters, Backstage requests, Jev prompts, logs or screenshots.
The frontend nginx proxies only `/api` and `/auth/check` to the private
backend; `/metrics` stays on the ClusterIP service.

For a key/password rotation, an authorized operator updates the exact
Secrets Manager item privately. Check ExternalSecret Ready and refresh time
without displaying values. Its refresh interval is five minutes; a Retain
deletion policy can leave the last Kubernetes Secret present after the AWS
source disappears, so Ready/staleness must be checked independently. Existing
environment variables in running backend Pods do not update automatically:
request a reviewed backend rollout after sync, then verify new Pods and a
bounded functional check. Never use an ungoverned pod-delete button.

Backstage users authenticate with mapped GitHub identities. App requests may
be submitted by authorized `rizz-team` or `platform-team` members; a different
eligible member reviews routine changes. App retirement and infrastructure
plans require a distinct platform reviewer. GitHub/CI, GitOps publishing,
Argo, cloud readers and Terraform runners each need separate least-privilege
credentials. A Backstage group is not AWS authority. Remove access through
identity/group and credential rotation procedures; do not edit a proposal's
record to grant access retroactively.
