# Rizz.AI

React/nginx frontend and private Express/Gemini backend. No application database is currently required.

Application source and build checks live here; Backstage Agent Guard owns platform policy and release proposals; GitOps owns deployed desired state. Application CI must not provision infrastructure or deploy Kubernetes workloads.

This checkout is being prepared for governed EKS staging delivery. Neither catalog registration nor a successful local build means it has been deployed. See the local readiness runbook and release contract for tested behavior and remaining gates.

The application catalog owner is `rizz-team`; the shared EKS foundation stays
`platform-team` owned. Catalog ownership does not by itself grant review or
cloud authority. Backstage checks authenticated group membership and requires
a different eligible app or platform reviewer for routine changes. Retirement
and foundation changes require a distinct platform reviewer.

The initial access strategy is a shared staging demo password behind HTTPS when public. Never store the Gemini key, demo password, AWS credentials or Terraform state in source, release metadata, images or portal forms.

The backend exposes process-local Prometheus text at `/metrics` on its private
ClusterIP service. Only fixed route/outcome labels are recorded; no prompts,
provider responses or credentials. It is not exposed by the frontend nginx
proxy. Counters reset on process restart and are per replica; aggregate in a
real metrics backend before treating them as application-wide totals. Readiness
endpoints never call Gemini. A healthy `/readyz` does not prove generation
works.
