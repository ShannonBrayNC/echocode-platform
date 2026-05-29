import assert from "node:assert/strict";
import test from "node:test";

import { defaultEchoCodexPolicy, type EchoCodexPolicy } from "../../src/policy/EchoCodexPolicy.js";
import { evaluatePolicyGate } from "../../src/policy/evaluatePolicyGate.js";

function policy(overrides: Partial<EchoCodexPolicy> = {}): EchoCodexPolicy {
  return {
    ...defaultEchoCodexPolicy,
    ...overrides
  };
}

test("default config allows dry-run only", () => {
  const result = evaluatePolicyGate({
    policy: defaultEchoCodexPolicy,
    repo: "ShannonBrayNC/echocode-platform",
    changedPaths: ["src/policy/evaluatePolicyGate.ts"]
  });

  assert.equal(result.effectiveMode, "dryRun");
  assert.equal(result.decision, "allow");
  assert.deepEqual(result.reasons, []);
});

test("workspace writes are blocked without policy approval", () => {
  const result = evaluatePolicyGate({
    policy: defaultEchoCodexPolicy,
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/policy/evaluatePolicyGate.ts"]
  });

  assert.equal(result.decision, "block");
  assert.equal(result.reasons[0].code, "mode-not-allowed");
});

test("workspace writes require human approval when policy permits mode", () => {
  const result = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "writeWorkspace"] }),
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/policy/evaluatePolicyGate.ts"]
  });

  assert.equal(result.decision, "requires-human-approval");
  assert.equal(result.reasons[0].code, "human-approval-required");
});

test("workspace writes are allowed with policy and human approval", () => {
  const result = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "writeWorkspace"] }),
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/policy/evaluatePolicyGate.ts"],
    humanApproval: true
  });

  assert.equal(result.decision, "allow");
});

test("protected branch writes are always blocked", () => {
  const result = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "writeWorkspace", "createBranch", "openPullRequest", "autoMerge"], allowAutoMerge: true }),
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "main",
    changedPaths: ["src/index.ts"],
    humanApproval: true,
    validationPassed: true
  });

  assert.equal(result.decision, "block");
  assert.equal(result.reasons[0].code, "protected-branch");
});

test("branch creation and pull request modes require approval when enabled", () => {
  const enabledPolicy = policy({ allowedModes: ["dryRun", "createBranch", "openPullRequest"] });

  const branchResult = evaluatePolicyGate({
    policy: enabledPolicy,
    requestedMode: "createBranch",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["tests/policy/evaluatePolicyGate.test.ts"]
  });

  const prResult = evaluatePolicyGate({
    policy: enabledPolicy,
    requestedMode: "openPullRequest",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["tests/policy/evaluatePolicyGate.test.ts"],
    humanApproval: true
  });

  assert.equal(branchResult.decision, "requires-human-approval");
  assert.equal(prResult.decision, "allow");
});

test("auto-merge is blocked unless validation passes and policy allows it", () => {
  const disabled = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "autoMerge"] }),
    requestedMode: "autoMerge",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/index.ts"],
    humanApproval: true,
    validationPassed: true
  });

  const noValidation = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "autoMerge"], allowAutoMerge: true }),
    requestedMode: "autoMerge",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/index.ts"],
    humanApproval: true,
    validationPassed: false
  });

  const allowed = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "autoMerge"], allowAutoMerge: true }),
    requestedMode: "autoMerge",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/index.ts"],
    humanApproval: true,
    validationPassed: true
  });

  assert.equal(disabled.decision, "block");
  assert.equal(disabled.reasons[0].code, "auto-merge-disabled");
  assert.equal(noValidation.decision, "block");
  assert.equal(noValidation.reasons[0].code, "validation-required");
  assert.equal(allowed.decision, "allow");
});

test("deny path rules block protected files", () => {
  const result = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "writeWorkspace"] }),
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: [".env.local"],
    humanApproval: true
  });

  assert.equal(result.decision, "block");
  assert.equal(result.reasons[0].code, "denied-path");
});

test("allow path rules block scope escapes", () => {
  const result = evaluatePolicyGate({
    policy: policy({ allowedModes: ["dryRun", "writeWorkspace"] }),
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["unknown/file.txt"],
    humanApproval: true
  });

  assert.equal(result.decision, "block");
  assert.equal(result.reasons[0].code, "path-not-allowed");
});

test("per-repo overrides can enable safe automation", () => {
  const result = evaluatePolicyGate({
    policy: policy({
      repoOverrides: [
        {
          repo: "ShannonBrayNC/echocode-platform",
          allowedModes: ["dryRun", "writeWorkspace"],
          requireHumanApprovalBeyondDryRun: false,
          protectedBranches: ["main"],
          allowPaths: [{ pattern: "src/**" }]
        }
      ]
    }),
    requestedMode: "writeWorkspace",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/policy",
    changedPaths: ["src/policy/evaluatePolicyGate.ts"]
  });

  assert.equal(result.decision, "allow");
  assert.equal(result.humanApprovalRequired, false);
});
