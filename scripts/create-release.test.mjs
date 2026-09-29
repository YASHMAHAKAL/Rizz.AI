import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createReleaseRecord } from "./create-release.mjs";
const now = new Date("2026-09-26T10:00:00Z");
const env = {
  GITHUB_SHA: "a".repeat(40),
  GITHUB_REPOSITORY: "example-owner/Rizz.AI",
  GITHUB_REF: "refs/heads/master",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  RIZZ_AWS_ACCOUNT_ID: "000000000000",
  GITHUB_RUN_ID: "100",
  GITHUB_RUN_ATTEMPT: "1",
};
function fixtures() {
  return Object.fromEntries(
    ["frontend", "backend"].map((component, i) => {
      const imageId = `sha256:${String(i + 1).repeat(64)}`;
      const imageManifest = JSON.stringify({
        schemaVersion: 2,
        config: { digest: imageId },
        layers: [],
      });
      return [
        component,
        {
          imageId,
          scan: {
            ArtifactName: `rizz-${component}:phase1-local`,
            Metadata: { ImageID: imageId },
            Results: [{ Vulnerabilities: [] }],
          },
          registry: {
            failures: [],
            images: [
              {
                registryId: env.RIZZ_AWS_ACCOUNT_ID,
                repositoryName: `rizz-staging-${component}`,
                imageManifest,
                imageId: {
                  imageDigest: `sha256:${createHash("sha256")
                    .update(imageManifest)
                    .digest("hex")}`,
                },
              },
            ],
          },
        },
      ];
    })
  );
}
test("pairs verified scanned/pushed images from one commit and expires after 30 days", () => {
  const record = createReleaseRecord(env, fixtures(), now);
  assert.equal(record.releaseId, `rizz-${env.GITHUB_SHA}-100-1`);
  assert.equal(
    Date.parse(record.expiresAt) - Date.parse(record.createdAt),
    30 * 86400000
  );
  assert.equal(
    record.images.frontend.sourceCommit,
    record.images.backend.sourceCommit
  );
});
test("rejects pull requests, wrong branch, mutable identity and unsafe IDs", () => {
  for (const change of [
    { GITHUB_EVENT_NAME: "pull_request" },
    { GITHUB_REF: "refs/heads/feature" },
    { GITHUB_SHA: "latest" },
    { GITHUB_RUN_ID: "9007199254740993" },
  ])
    assert.throws(() =>
      createReleaseRecord({ ...env, ...change }, fixtures(), now)
    );
});
test("rejects high/critical scan results and incomplete scan evidence", () => {
  for (const severity of ["HIGH", "CRITICAL", "invalid"]) {
    const evidence = fixtures();
    evidence.frontend.scan.Results[0].Vulnerabilities = [
      { Severity: severity },
    ];
    assert.throws(() => createReleaseRecord(env, evidence, now));
  }
  const evidence = fixtures();
  evidence.backend.scan.Results = [];
  assert.throws(() => createReleaseRecord(env, evidence, now));
});
test("rejects a different scanned image, changed manifest, account or repository", () => {
  for (const mutate of [
    (e) => (e.backend.scan.Metadata.ImageID = `sha256:${"f".repeat(64)}`),
    (e) => (e.backend.registry.images[0].imageManifest += " "),
    (e) => (e.frontend.registry.images[0].registryId = "111111111111"),
    (e) => (e.frontend.registry.images[0].repositoryName = "untrusted"),
  ]) {
    const evidence = fixtures();
    mutate(evidence);
    assert.throws(() => createReleaseRecord(env, evidence, now));
  }
});
