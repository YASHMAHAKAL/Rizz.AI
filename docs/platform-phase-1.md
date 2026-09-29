# Phase 1: local application readiness

Historical Phase 1 handoff. Phase 2 has now replaced the legacy deployment workflow locally with build-only checks; see [release contract](release-contract.md) for the current CI boundary. No changes have been published remotely yet.

The real runtime uses Google Gemini API through `@google/genai`. No model output is fabricated in the production entrypoint. The separate `test/mock-server.js` fixture is excluded from the production image and requires the explicit local smoke override. Phase 1 does not publish images, provision AWS, deploy Kubernetes resources, or change the old deployment workflow.

## Tests and reproducible builds

Supported Node runtime: 22.12+ in the 22 series, or Node 24. Container builds pin the official Node 24 and nginx base-image index digests. Dependency locks are committed candidates; use `npm ci`, not an unconstrained install, for reproduction. Recheck versions and image vulnerabilities before a real release.

```bash
cd /home/yash/Rizz.AI/backend
npm ci --ignore-scripts
npm test

cd /home/yash/Rizz.AI/rizz-app
npm ci --ignore-scripts
npm test
npm run build
```

Backend tests inject fake providers; frontend service tests replace fetch. They do not exercise a real Gemini account, billing, model availability, UI interactions, or EKS.

### Verification recorded on 2026-09-26

- Backend: 10 tests passed; frontend API service: 6 tests passed.
- Production frontend build passed with Vite 7.3.6. Both dependency audits reported zero known npm vulnerabilities at the time of verification; this is not a container vulnerability scan or a security guarantee.
- Both Docker images built from the lockfiles. The isolated two-container smoke check passed authentication, static assets, readiness, validation and all three mock-provider endpoint contracts.
- Both running containers were healthy, non-root and read-only. The backend image contained neither `/app/.env` nor the test fixture directory.
- Kustomize rendered six resources; kubeconform v0.8.0 strict validation against Kubernetes 1.35 schemas reported six valid, zero invalid, zero errors and zero skipped. This does not select the future EKS version or prove admission/rollout behavior on a cluster.
- No real Gemini requests, image publication, AWS provisioning, Kubernetes application, commits or pushes were performed. The isolated smoke containers were removed after verification; local build images were retained.

## Mocked two-container smoke demonstration

Use the explicit override; this starts a local fixture, not Gemini:

```bash
cd /home/yash/Rizz.AI
docker compose -p rizz-phase1-smoke -f compose.local.yaml -f compose.smoke.yaml up --build -d --wait --wait-timeout 60
node scripts/smoke.mjs
docker compose -p rizz-phase1-smoke -f compose.local.yaml -f compose.smoke.yaml down
```

The only published port is `127.0.0.1:8088`. Its fixed smoke credentials are public test fixtures and must never be reused for a cloud deployment. Browser authentication is `smoke` / `local-smoke-fixture-password`; output explicitly says MOCK PROVIDER. Smoke resources use their own Compose project and do not touch the existing Kind demo. The script checks root/assets, authentication, health/readiness, validation, proxy routing and all three endpoint shapes. Successful curl/fetch smoke checks are not a browser UI test.

## Live Gemini configuration: separate, opt-in

Copy `backend/.env.example` to ignored `backend/.env` and edit it locally. Do not paste credentials into chat or commit them. The required values are:

| Setting | Purpose |
| --- | --- |
| `GEN_AI_KEY` | Your Google Gemini API credential; backend only |
| `GEMINI_MODEL` | Explicit supported model ID for your account, with text/image and structured output support |
| `DEMO_USERNAME` | Simple demo username: letters, numbers, underscore or hyphen |
| `DEMO_PASSWORD` | Unique 16–256-character demo password; do not reuse your Google/AWS credentials |

The example model `gemini-3.1-flash-lite` was listed as stable in Google's model documentation during setup. Account access and live responses have not been verified. Operator-configured model IDs are validated syntactically; a cloud recipe must later allowlist permitted models. Do not assume the old preview model still works.

After explicitly deciding to make live calls:

```bash
cd /home/yash/Rizz.AI
docker compose --env-file backend/.env -p rizz-phase1-live -f compose.local.yaml up --build -d --wait --wait-timeout 60
```

Open `http://localhost:8088`; the browser prompts for the configured demo username/password. Static UI and API are protected through nginx's auth subrequest, and the backend rechecks API credentials. This is a shared-password staging gate, not production end-user identity. HTTP is acceptable only on the loopback-local setup; expose the cloud frontend only behind HTTPS. Do not run live and smoke stacks concurrently on port 8088.

Stop the local live stack with the same Compose project/configuration. No frontend API key or browser token entry is used. Environment values are visible to users with Docker administration rights; AWS deployment will use Secrets Manager/External Secrets, not this local file.

## Runtime guarantees and limits

- `/healthz` reports process liveness. `/readyz` requires a configured key/model/demo login, a provider adapter, and a non-draining server. Neither probe calls Gemini or proves the key/model works remotely.
- Missing configuration gives not-ready/503, never a fake successful reply. Provider errors, malformed results and timeouts are explicit failures. Frontend alerts report them and credits decrease only on successful responses.
- JSON body cap 3 MB, prompts/messages bounded, history limited, image uploads up to 2 MiB in PNG/JPEG/WebP data-URI form with signature checks. Image signatures are basic validation, not a malware scan/full image decoder.
- Provider requests default to 25 seconds, 2 concurrent operations, 10 accepted requests/minute and 100 provider calls per process lifetime. Output is capped at 1024 tokens and SDK retries are disabled. Authentication failures also have an aggregate per-process limit.
- Limits are in-memory per replica and reset on restart; two replicas can double them, and rollout surge temporarily adds capacity. They are abuse controls, **not a hard account-wide spending cap**. A provider request may still be billed after client cancellation. Add provider-side controls or shared enforcement if stronger quota guarantees are required.
- Structured backend logs include generated request IDs, route, status and duration, excluding request bodies, auth headers and raw provider errors. nginx logs status/duration only. No unrestricted CORS is enabled.
- Containers run non-root with read-only roots, temporary storage, dropped capabilities and no-new-privileges. Backend drain marks readiness false before shutdown. nginx has a graceful Kubernetes preStop hook.

## Kubernetes handoff, not a deployed release

```bash
cd /home/yash/Rizz.AI
kubectl kustomize deploy/kubernetes/base
```

The base renders namespace/configuration, two Deployments and two internal ClusterIP Services. It has labels suitable for Backstage resource association, explicit probes/resources, restricted Pod security, no mounted service-account token, and references to `rizz-runtime-secrets`. It includes no secret values, public ingress, controller installation or AWS resources.

`rizz-frontend:release-required` and `rizz-backend:release-required` are deliberately non-deployable placeholders. **Do not apply this base directly.** The later verified-release renderer must replace both with approved ECR digests, bind model/configuration and replica counts to approval, and publish the resulting desired state in the GitOps repo. Replicas in this base are a default, not an enforced maximum; Agent Guard will enforce 1–2 in the cloud recipe. The Secret must be supplied by the approved secret-sync configuration. Ingress/HTTPS are later platform-owned configuration.

The cloud GitOps repo owns the actual deployed files. This source-repo base is the initial application recipe/handoff; define its pinned transfer/version relationship when implementing the platform renderer to avoid two drifting manifest owners.

## Release safety and next steps

Do not push these changes casually: the existing `.github/workflows/deploy.yml` still uses long-lived AWS keys, auto-applies Terraform and deploys directly on source pushes. It was left unchanged in this local readiness phase. Before publishing source changes, replace or safely disable that delivery path through a separately reviewed CI change. Current root YAML targets port 80 and old local images; those legacy files are not the new recipe.

Next phases: safe test/build-only CI, trusted paired release metadata, ECR/remote-state/OIDC bootstrap and reviewed infrastructure; cloud target/template and hash-bound review; GitOps merge→Argo deployment; both-workload/smoke verification and authorized teardown.

References: [Google Gemini SDK](https://ai.google.dev/gemini-api/docs/libraries), [model catalog](https://ai.google.dev/gemini-api/docs/models), [nginx auth subrequests](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html).
