# Paired ECR publisher — local code, not enabled

`publish.yml` tests/builds/scans the real frontend/backend images, then pushes the same scanned pair with unique immutable run tags. `create-release.mjs` validates scan image IDs against stored ECR manifest config digests and checks exact manifest hashes/account/repos before creating `release.json`. No Terraform/kubectl/Argo step exists.

Operator opt-in `RIZZ_ECR_PUBLISH_ENABLED=true` and reviewed `RIZZ_AWS_ACCOUNT_ID`/`RIZZ_PUBLISH_ROLE_ARN` are required. AWS role/repositories must already exist through separately authorized platform Terraform. Workflow supports only `master` pushes/dispatch, never PRs. No activation, dispatch or push happened during local preparation. Don't copy application keys into workflow inputs or variables.

The ZIP artifact is `rizz-release-<run_id>-<attempt>`, single record, 30-day retention, overwrite disabled. Both image tags include commit/run/attempt. Interrupted publishing may retain a tagged image without an eligible pair; retry with a new attempt, not immutable-tag overwrite. Backend independently verifies successful workflow/steps, GitHub artifact checksum and both ECR digests. Metadata flags describe actual CI success, not deployment permission or signed attestations. Trusted branch writers remain trusted with the repo/branch OIDC role.

Scan gates may fail on current vulnerabilities; repair dependencies/images rather than weakening them just for a demo. CI smoke uses an explicit mounted mock backend and makes no Gemini call. Actual cloud/image publishing has not been verified yet. GitHub CI quotas/registry costs are not assumed free.

Local fixture tests: `node scripts/create-release.test.mjs`. Generated `release.json` and reports are ignored. Scan reports/image manifests are validation inputs; only the paired metadata is uploaded as the release artifact. A CI artifact is not a GitOps PR: deployment still needs Backstage distinct review, approved PR, human merge and Argo reconciliation.

Before publishing any source changes, review retirement of the old direct AWS deploy workflow. Full operator activation and trust limitations are documented in the platform repository's `docs/rizz-ai-release-publishing.md`.
