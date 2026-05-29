import assert from "node:assert/strict";
import test from "node:test";

import { runEchoCodexSprint } from "../../src/runner/runEchoCodexSprint.js";
import { defaultEchoCodexPolicy } from "../../src/policy/EchoCodexPolicy.js";
import type { EchoCodexRunnerConfig, RunnerIssue } from "../../src/github/types.js";

const runnerConfig: EchoCodexRunnerConfig = {
  repoPriority: [
    {
      repo: "ShannonBrayNC/echocode-platform",
      priority: 100,
      labels: ["echocodex"]
    }
  ],
  blockedLabels: ["blocked"],
  priorityLabels: {
    "christina-ready": 25
  },
  maxItems: 5
};

const issues: RunnerIssue[] = [
  {
    repo: "ShannonBrayNC/echocode-platform",
    number: 46,
    title: "Create internal CLI runner for dry-run sprint execution",
    body: "Mock issue body",
    labels: ["christina-ready"],
    priority: 100,
    updatedAt: "2026-05-29T06:00:00Z",
    url: "https://github.com/ShannonBrayNC/echocode-platform/issues/46",
    sourceSystem: "github"
  }
];

const repoContext = {
  repositoryName: "ShannonBrayNC/echocode-platform",
  fileTree: [
    "package.json",
    "tsconfig.json",
    "src/runner/runEchoCodexSprint.ts",
    "src/cli/echocodex.ts",
    "tests/cli/echocodex.test.ts"
  ]
};

test("dry-run sprint runner returns machine-readable result and report path", async () => {
  const result = await runEchoCodexSprint({
    runnerConfig,
    policy: defaultEchoCodexPolicy,
    issues,
    repoContext,
    currentBranch: "main",
    mode: "dryRun",
    actor: "test-runner",
    timestamp: "2026-05-29T06:00:00Z"
  });

  assert.equal(result.mode, "dryRun");
  assert.equal(result.maxItems, 5);
  assert.equal(result.selectedIssue?.number, 46);
  assert.equal(result.policyDecision.decision, "allow");
  assert.equal(result.validationStatus, "preview");
  assert.match(result.reportPath, /reports\/echocodex\/runs\/20260529060000-shannonbraync-echocode-platform-46/);
  assert.ok(result.artifacts.some((artifact) => artifact.path.endsWith("run.json")));
});

test("non-dry-run mode is blocked by default policy", async () => {
  const result = await runEchoCodexSprint({
    runnerConfig,
    policy: defaultEchoCodexPolicy,
    issues,
    repoContext,
    currentBranch: "feature/cli",
    mode: "openPullRequest",
    actor: "test-runner",
    timestamp: "2026-05-29T06:00:00Z"
  });

  assert.equal(result.mode, "openPullRequest");
  assert.equal(result.policyDecision.decision, "block");
  assert.equal(result.policyDecision.reasons[0].code, "mode-not-allowed");
  assert.equal(result.nextAction, "human-review-required");
});

test("runner throws when no eligible issue exists", async () => {
  await assert.rejects(
    runEchoCodexSprint({
      runnerConfig,
      policy: defaultEchoCodexPolicy,
      issues: [],
      repoContext,
      mode: "dryRun",
      actor: "test-runner",
      timestamp: "2026-05-29T06:00:00Z"
    }),
    /No eligible issue selected/
  );
});
