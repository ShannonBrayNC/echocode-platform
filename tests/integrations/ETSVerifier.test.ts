import assert from "node:assert/strict";
import test from "node:test";

import { evaluateLocalTrust, NoopETSVerifier } from "../../src/integrations/ets/ETSVerifier.js";

const provenance = {
  sourceSystem: "christina",
  sourceActor: "runner",
  createdAt: "2026-05-29T06:00:00Z"
};

test("missing provenance requires human review", () => {
  const result = evaluateLocalTrust({
    recommendationId: "rec-1",
    requestedMode: "openPullRequest"
  });

  assert.equal(result.trustState, "RequiresHumanReview");
  assert.equal(result.canTriggerWriteOrPr, false);
});

test("unsigned provenance cannot trigger write or PR actions", () => {
  const result = evaluateLocalTrust({
    recommendationId: "rec-2",
    requestedMode: "openPullRequest",
    provenance
  });

  assert.equal(result.trustState, "RequiresHumanReview");
  assert.equal(result.canTriggerWriteOrPr, false);
  assert.match(result.reasons[0], /cannot trigger write or PR actions/);
});

test("unsigned provenance is unverified for dry-run analysis", () => {
  const result = evaluateLocalTrust({
    recommendationId: "rec-3",
    requestedMode: "dryRun",
    provenance
  });

  assert.equal(result.trustState, "Unverified");
  assert.equal(result.canTriggerWriteOrPr, false);
});

test("signed provenance returns verified local shape", () => {
  const result = evaluateLocalTrust({
    recommendationId: "rec-4",
    requestedMode: "openPullRequest",
    provenance: {
      ...provenance,
      signature: "local-shape-signature"
    }
  });

  assert.equal(result.trustState, "Verified");
  assert.equal(result.canTriggerWriteOrPr, true);
});

test("no-op verifier delegates to local trust evaluation", async () => {
  const verifier = new NoopETSVerifier();
  const result = await verifier.verify({
    recommendationId: "rec-5",
    requestedMode: "writeWorkspace",
    provenance
  });

  assert.equal(result.trustState, "RequiresHumanReview");
  assert.equal(result.canTriggerWriteOrPr, false);
});
