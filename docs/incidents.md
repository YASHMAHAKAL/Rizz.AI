# Gemini outage and failed rollout

## Distinguish failure domains

`/healthz` is process liveness. `/readyz` checks local configuration, provider
adapter presence and draining state; neither calls Gemini. A 200 from either
does not prove generation works. The optional bounded smoke check explicitly
reports whether it used a mock provider, routed cloud health, or one authorized
live Gemini call. Never silently treat a mock result as provider success.

For a failed request, use its `X-Request-ID` to find sanitized backend logs.
Logs contain fixed route, status, duration and error code, never prompts,
images, API keys or provider response bodies. The private `/metrics` endpoint
exports fixed-label request counts/duration, provider outcomes (success,
timeout, rate-limited, unavailable, invalid response, cancelled), in-flight
calls and this process's demo call budget. Counters are per replica and reset
on restart; two replicas can double the effective total call allowance unless
an external shared limiter is introduced.

When Gemini is unavailable or rate-limited, the API returns a sanitized 502,
503 or 504 rather than a fabricated successful answer. Check recent provider
outcome counts and backend errors; verify the configured model and out-of-band
key status without printing secret values. Do not increase replica count to
hide a provider quota problem. A real provider probe can incur cost and must
be explicitly bounded and authorized.

For a failed rollout, inspect the exact GitOps PR/merge, Argo revision and
conditions, frontend and backend Deployment/ReplicaSet/Pod events, image pull,
readiness and ExternalSecret status. Frontend Ready with backend unavailable is
an application failure. Compare desired image digests with observed Pods; a
successful PR or Argo `Synced` status alone is not enough. If the previous
healthy release is retained and compatible, use the governed rollback flow.
If cluster/controller/ALB state is broken, escalate to the platform runbook;
application rollback is not a Terraform or infrastructure repair.
