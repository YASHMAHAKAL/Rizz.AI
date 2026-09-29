# Deploy, update and roll back Rizz.AI staging

These steps describe the governed GitOps path. Backstage runs locally; EKS
staging is a separate target from the three Kind demo templates. No release
proposal provisions EKS or runs Terraform.

1. Verify the source workflow published one paired frontend/backend release
   from the same commit. Inspect its successful tests, dependency and image
   scans, immutable ECR digests, record digest and expiry in Backstage's
   Rizz.AI Control Center. A CI artifact is not a deployment.
2. In **Governed deployments**, select that release and bounded replicas
   (1–2), describe the intent, and submit. The backend rechecks independent CI,
   ECR, catalog and target evidence. Jev checks semantic alignment; it does
   not grant permission. A different eligible human reviews the exact frozen
   manifests and digest.
3. Approval starts a private Scaffolder task which opens an exact-base draft
   GitOps PR. Review its nine allowed files, required checks, base revision
   and restricted HTTPS ingress. Human merge is a separate release decision.
   Argo reconciles only after merge and its configured sync policy permits it.
4. Inspect Backstage's read-only delivery observation: exact merged files,
   matching Argo revision, both Deployment rollouts and routed smoke. A task,
   PR or Argo `Synced` badge alone is not success. Record the observed time,
   merge revision and incident/change ticket.

To change replicas without rebuilding images, use the runtime-change form.
The backend reads existing desired state and permits only typed replica changes;
omitted fields, image digests, Gemini model, routing and secret references must
remain unchanged. A count above two or unknown API Gateway prefix is rejected
before Jev. Preview the exact before/after, then follow the same review/PR path.

For rollback, select a **previously verified release deployment**, not merely
an earlier CI build. Preview must reverify retained artifact/images and show
only the restored paired digests and compatible replicas changing. Protected
ingress, secrets and other manifests must match current policy. A different
reviewer approves a new draft PR; do not run `kubectl rollout undo`, direct
Argo sync, or `git revert` under the old approval. After merge, verify both
rollouts and smoke again. Missing/expired evidence or changed protected config
needs a new release or reviewed migration, not a forced rollback.

New release records and GitHub artifacts expire after 30 days; ECR tags are
retained until reviewed cleanup. GitHub repository-level settings can shorten
artifact retention. The portal lists only recent runs but exact lookup can
resolve an older retained release ID. Stored deployment history does not keep
an expired CI artifact alive. No live EKS success is claimed by these docs.
