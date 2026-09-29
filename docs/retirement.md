# Staging retirement and foundation teardown

Retiring the application is destructive and separate from destroying the
shared AWS foundation. Before approving it, identify the exact EKS account,
cluster, namespace, Argo Application, app files, ALB, target groups,
ExternalSecret and any other workloads sharing the namespace. Preserve the
request, approvals, deployment history and recovery evidence outside the
cluster. Decide how long ECR images, CI artifacts, Secrets Manager secret and
state are retained; record the decisions.

Remove the app Ingress through a separately reviewed GitOps change **while
the load-balancer controller and IAM are still running**. Observe Ingress
deletion and independently verify the controller-owned ALB, listeners and
target groups are gone. Unknown AWS inventory is not proof of zero residual
cost. Only then submit the second Agent Guard retirement stage. It deletes the
remaining workload/config/secret-sync manifests and leaves one empty
`kustomization.yaml` marker. After human merge, an authorized Argo operator
must sync this exact revision with pruning and verify Deployments, Services,
Pods, ReplicaSets, ConfigMap, SecretStore and ExternalSecret are absent. A
portal refresh does not sync. The empty marker and Argo Application remain
until a separate platform cleanup decision; the initial bootstrap Application
is not managed by a parent GitOps application. Do not delete it while it owns
live resources or allow a stale bootstrap to recreate the old app. Namespace
deletion requires an inventory proving no other workload depends on it. Do
not casually turn on `allowEmpty` or automatic pruning as a shortcut.

The portal checks the merged PR, exact GitOps files, Ingress/ALB/target-group
absence and remaining app resource names. It does not read Secret values or
prove that the AWS Secrets Manager secret, ECR images, namespace, Argo
Application or Terraform foundation were deleted. Record those retention and
later cleanup decisions explicitly.

Foundation destroy is a separate, platform-only exact saved-plan review. It
must check app/ALB cleanup first, then destroy roots in dependency order while
retaining the state backend until no dependent root uses it. Afterward inspect
EKS/node groups, NAT, ALB/target groups, public IPs, EBS, ECR, Secrets Manager
and state for absent/retained/residual/unavailable resources. Budget alerts
are not a hard spending cap. No command in this document authorizes an AWS
apply or destroy.
