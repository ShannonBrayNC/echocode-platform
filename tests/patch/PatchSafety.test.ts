import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePatchSafety } from "../../src/patch/PatchSafety.js";
import { renderUnifiedDiff } from "../../src/patch/renderUnifiedDiff.js";
import type { ProposedPatch } from "../../src/patch/PatchModel.js";

function basePatch(overrides: Partial<ProposedPatch> = {}): ProposedPatch {
  return {
    issue: {
      repo: "ShannonBrayNC/echocode-platform",
      number: 41,
      url: "https://github.com/ShannonBrayNC/echocode-platform/issues/41"
    },
    rationale: "Add patch generation safety model.",
    validationCommands: ["npm run build", "npm test", "npm run typecheck"],
    rollbackNotes: ["Discard generated patch preview artifacts."],
    changes: [
      {
        action: "update",
        path: "src/patch/PatchSafety.ts",
        before: "export const oldValue = true;",
        after: "export const newValue = true;",
        rationale: "Implement safety evaluator."
      }
    ],
    ...overrides
  };
}

test("allows normal source file changes in dry-run", () => {
  const result = evaluatePatchSafety(basePatch());

  assert.equal(result.safe, true);
  assert.equal(result.approvalState, "requires-human-review");
  assert.equal(result.autoApproved, false);
  assert.deepEqual(result.findings, []);
});

test("auto approval approves only clean safe patches", () => {
  const result = evaluatePatchSafety(
    basePatch({
      autoApproval: {
        mode: "safeOnly",
        requestedBy: "christina"
      }
    })
  );

  assert.equal(result.safe, true);
  assert.equal(result.approvalState, "approved");
  assert.equal(result.autoApproved, true);
});

test("auto approval does not approve warning scenarios", () => {
  const result = evaluatePatchSafety(
    basePatch({
      autoApproval: {
        mode: "safeOnly"
      },
      changes: [
        {
          action: "update",
          path: "src/index.ts",
          after: "export const value = true;",
          rationale: "Missing before content should warn."
        }
      ]
    })
  );

  assert.equal(result.safe, true);
  assert.equal(result.approvalState, "requires-human-review");
  assert.equal(result.autoApproved, false);
  assert.equal(result.findings[0].code, "missing-before-content");
});

test("blocks secret and certificate paths", () => {
  const result = evaluatePatchSafety(
    basePatch({
      changes: [
        {
          action: "create",
          path: ".env",
          after: "TOKEN=value",
          rationale: "Should be blocked."
        },
        {
          action: "update",
          path: "certs/app.pfx",
          before: "old",
          after: "new",
          rationale: "Should be blocked."
        }
      ]
    })
  );

  assert.equal(result.safe, false);
  assert.equal(result.approvalState, "blocked");
  assert.deepEqual(
    result.findings.map((finding) => finding.code),
    ["protected-secret-path", "protected-secret-path"]
  );
});

test("blocks protected lockfiles unless explicitly allowed", () => {
  const patch = basePatch({
    changes: [
      {
        action: "update",
        path: "package-lock.json",
        before: "{}",
        after: "{}",
        rationale: "Lockfile update."
      }
    ]
  });

  const blocked = evaluatePatchSafety(patch);
  assert.equal(blocked.approvalState, "blocked");
  assert.equal(blocked.findings[0].code, "protected-lockfile");

  const allowed = evaluatePatchSafety(patch, { allowLockfileChanges: true });
  assert.equal(allowed.safe, true);
});

test("blocks GitHub workflows unless explicitly allowed", () => {
  const patch = basePatch({
    changes: [
      {
        action: "update",
        path: ".github/workflows/echocodex.yml",
        before: "name: old",
        after: "name: new",
        rationale: "Workflow update."
      }
    ]
  });

  const blocked = evaluatePatchSafety(patch);
  assert.equal(blocked.approvalState, "blocked");
  assert.equal(blocked.findings[0].code, "protected-workflow");

  const allowed = evaluatePatchSafety(patch, { allowWorkflowChanges: true });
  assert.equal(allowed.safe, true);
});

test("requires patch metadata", () => {
  const result = evaluatePatchSafety(
    basePatch({
      issue: { repo: "", number: 0 },
      rationale: "",
      validationCommands: [],
      rollbackNotes: []
    })
  );

  assert.deepEqual(
    result.findings.slice(0, 4).map((finding) => finding.code),
    [
      "missing-issue-reference",
      "missing-patch-rationale",
      "missing-validation-commands",
      "missing-rollback-notes"
    ]
  );
});

test("renders unified diff preview", () => {
  const diff = renderUnifiedDiff(basePatch());

  assert.match(diff, /EchoCodex patch preview/);
  assert.match(diff, /Issue: ShannonBrayNC\/echocode-platform#41/);
  assert.match(diff, /diff --git a\/src\/patch\/PatchSafety.ts b\/src\/patch\/PatchSafety.ts/);
  assert.match(diff, /-export const oldValue = true;/);
  assert.match(diff, /\+export const newValue = true;/);
});
