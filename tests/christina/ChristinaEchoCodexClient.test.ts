import assert from "node:assert/strict";
import test from "node:test";

import { sendChristinaDryRun, isValidChristinaDryRunResponse } from "../../src/christina/ChristinaEchoCodexClient.js";
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

test("Christina can send a dry run through EchoCodex and receive a valid response", async () => {
  const response = await sendChristinaDryRun({
    runnerConfig,
    policy: defaultEchoCodexPolicy,
    issues,
    repo: "ShannonBrayNC/echocode-platform",
    repoContext: {
      repositoryName: "ShannonBrayNC/echocode-platform",
      fileTree: [
        "package.json",
        "tsconfig.json",
        "src/runner/runEchoCodexSprint.ts",
        "src/christina/ChristinaEchoCodexClient.ts",
        "tests/christina/ChristinaEchoCodexClient.test.ts"
      ]
    },
    currentBranch: "main",
    actor: "christina",
    timestamp: "2026-05-29T07:30:00Z"
  });

  assert.equal(response.ok, true);
  assert.equal(response.mode, "dryRun");
  assert.equal(response.selectedIssue?.number, 46);
  assert.equal(response.policyDecision.decision, "allow");
  assert.equal(response.validationStatus, "preview");
  assert.equal(isValidChristinaDryRunResponse(response), true);
});
