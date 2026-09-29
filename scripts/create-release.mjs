import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const digestPattern = /^sha256:[a-f0-9]{64}$/;
export function createReleaseRecord(env, evidence, now = new Date()) {
  assert.match(env.GITHUB_SHA ?? "", /^[a-f0-9]{40}$/);
  assert.match(
    env.GITHUB_REPOSITORY ?? "",
    /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/
  );
  assert.equal(env.GITHUB_REF, "refs/heads/master");
  assert.ok(["push", "workflow_dispatch"].includes(env.GITHUB_EVENT_NAME));
  assert.match(env.RIZZ_AWS_ACCOUNT_ID ?? "", /^[0-9]{12}$/);
  for (const key of ["GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"]) {
    assert.match(env[key] ?? "", /^[1-9][0-9]*$/);
    assert.ok(Number.isSafeInteger(Number(env[key])));
  }
  const images = {};
  for (const component of ["frontend", "backend"]) {
    const { scan, registry, imageId } = evidence[component];
    assert.match(imageId, digestPattern);
    assert.equal(scan.ArtifactName, `rizz-${component}:phase1-local`);
    assert.equal(scan.Metadata?.ImageID, imageId);
    assert.ok(Array.isArray(scan.Results) && scan.Results.length);
    for (const result of scan.Results) {
      assert.ok(
        result.Vulnerabilities === undefined ||
          Array.isArray(result.Vulnerabilities)
      );
      for (const vulnerability of result.Vulnerabilities ?? []) {
        assert.ok(
          ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(
            vulnerability.Severity
          )
        );
        assert.ok(!["HIGH", "CRITICAL"].includes(vulnerability.Severity));
      }
    }
    assert.ok(!registry.failures?.length);
    assert.equal(registry.images?.length, 1);
    const published = registry.images[0];
    assert.equal(published.registryId, env.RIZZ_AWS_ACCOUNT_ID);
    assert.equal(published.repositoryName, `rizz-staging-${component}`);
    const manifest = JSON.parse(published.imageManifest);
    assert.equal(manifest.schemaVersion, 2);
    assert.equal(manifest.config?.digest, imageId); // Bind pushed image to exactly the scanned local image.
    const digest = `sha256:${createHash("sha256")
      .update(published.imageManifest)
      .digest("hex")}`;
    assert.equal(digest, published.imageId?.imageDigest);
    images[component] = {
      repository: `${env.RIZZ_AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/rizz-staging-${component}`,
      digest,
      sourceCommit: env.GITHUB_SHA,
    };
  }
  return {
    schemaVersion: 1,
    releaseId: `rizz-${env.GITHUB_SHA}-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}`,
    source: {
      repository: env.GITHUB_REPOSITORY,
      commit: env.GITHUB_SHA,
      ref: env.GITHUB_REF,
    },
    workflow: {
      path: ".github/workflows/publish.yml",
      runId: Number(env.GITHUB_RUN_ID),
      runAttempt: Number(env.GITHUB_RUN_ATTEMPT),
    },
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
    // Descriptive CI outcome, not authority: backend independently checks the run/steps/artifact/ECR.
    checks: {
      tests: "passed",
      scan: "passed",
      policyVersion: "rizz-build-v1-high-critical",
    },
    images,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const evidence = Object.fromEntries(
      ["frontend", "backend"].map((component) => [
        component,
        {
          scan: JSON.parse(readFileSync(`reports/${component}.json`, "utf8")),
          registry: JSON.parse(
            readFileSync(`reports/${component}-registry.json`, "utf8")
          ),
          imageId: process.env[`${component.toUpperCase()}_IMAGE_ID`],
        },
      ])
    );
    writeFileSync(
      "release.json",
      `${JSON.stringify(
        createReleaseRecord(process.env, evidence),
        null,
        2
      )}\n`,
      { flag: "wx", mode: 0o600 }
    );
  } catch {
    console.error(
      "Release evidence invalid; no eligible release record produced."
    );
    process.exitCode = 1;
  }
}
