# Paired release contract — v1

## Build checks are not release publishing

`ci.yml` replaces the old push-triggered AWS/Terraform/kubectl deployment workflow. It has `contents: read` only, tests both components, builds both images, runs an explicitly mocked integration and scans the local images with digest-pinned Trivy. HIGH/CRITICAL findings fail the build; unfixed findings are not silently ignored. Scan reports are retained for seven days. No AWS identity, provider key, image push, cluster access or deployable release record is involved.

The old workflow deletion takes effect remotely only after these changes are reviewed and published. Existing Terraform and root Kubernetes YAML remain historical inputs, not active release automation. Re-enabling the old workflow is not the normal rollback path.

## Future trusted publisher

ECR repositories and a least-privilege GitHub OIDC role must first exist through separately authorized infrastructure bootstrap. A reviewed source-branch publishing workflow will then test/scan and publish both images from the same commit, resolve their registry digests and publish one paired record. PR builds and failed builds must never publish a deployable record. No deploy permission belongs to this role.

The platform's `plugins/agent-guard-backend/src/releases.ts` is the current strict v1 validator. Required record fields:

- `schemaVersion: 1`; `releaseId: rizz-<40-character source SHA>-<runId>-<runAttempt>`.
- `source`: exact repository slug, full commit SHA, allowed `refs/heads/...` ref.
- `workflow`: allowed workflow path, successful run ID and attempt.
- `createdAt`, `expiresAt`: UTC timestamps; not future-created or expired.
- `checks`: `tests: passed`, `scan: passed`, `policyVersion: rizz-build-v1-high-critical`.
- `images.frontend` and `images.backend`: exact approved ECR repository, immutable `sha256:<64 lowercase hex>` digest and matching `sourceCommit`.

Unknown fields are rejected; do not include credentials, account login details or provider prompts. Image repository URLs necessarily identify the approved registry; they are not secret values.

## Trust cannot come from JSON claims

An authenticated backend adapter must independently verify the exact allowed repository, branch, publishing workflow, commit, run/attempt, successful conclusion and push/manual event. It must download an unexpired trusted artifact, bind the canonical record digest to those exact downloaded bytes/parsed data, and verify both image references still exist. `checks: passed` in an agent-supplied JSON file is not evidence.

Attestations and immutable artifact identity should strengthen this binding when publishing is implemented. Artifact URLs, credentials, arbitrary workflow names or image references must not be agent inputs. Record availability depends on actual artifact/image retention; missing/expired evidence makes a release unavailable. Keep the previously approved image pair and evidence long enough for rollback; define ECR/artifact retention together during bootstrap. Never assume GitHub's seven-day scan-report retention establishes release retention.

## Current behavior

The Backstage read-only browser has no live trusted source connected and lists zero deployable releases. Unit tests inject explicitly labeled fixtures; fixtures cannot become eligible for proposals. Source errors clear the listing instead of retaining a fresh-looking verified state. The cloud deployment template is not enabled.

A verified build is still not deployment authorization. Later: select release ID → resolve frozen evidence/digests → Jev semantic check → distinct authenticated review → approved GitOps PR → human merge → Argo rollout. Terraform does not run during an application release.
