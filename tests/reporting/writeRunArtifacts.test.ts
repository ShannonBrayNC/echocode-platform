import assert from "node:assert/strict";
import test from "node:test";

import { createEchoCodexRunReport, createRunId } from "../../src/reporting/EchoCodexRunReport.js";
import { redactSensitiveValues } from "../../src/reporting/redactSensitiveValues.js";
import { buildRunArtifacts } from "../../src/reporting/writeRunArtifacts.js";
import type { PolicyGateResult } from "../../src/policy/EchoCodexPolicy.js";
import type { ValidationReport } from "../../src/validation/ValidationReport.js";

const policyDecision: PolicyGateResult = {
  decision: "requires-human-approval",
  effectiveMode: "openPullRequest",
  repo: "ShannonBrayNC/echocode-platform",
  branch: "feature/reporting",
  reasons: [
    {
      code: "human-approval-required",
      message: "openPullRequest requires human approval before execution."
    }
  ],
  humanApprovalRequired: true
};

const validationReport: ValidationReport = {
  repo: "ShannonBrayNC/echocode-platform",
  mode: "preview",
  generatedAt: "2026-05-29T00:00:00Z",
  commands: [
    {
      kind: "test",
      command: "npm test",
      cwd: ".",
      source: "node-default",
      required: true
    }
  ],
  results: [
    {
      command: {
        kind: "test",
        command: "npm test",
        cwd: ".",
        source: "node-default",
        required: true
      },
      status: "preview",
      failureClass: "none"
    }
  ],
  warnings: [],
  blocked: false,
  markdown: "# Validation\n\nTOKEN=super-secret-value\n"
};

test("creates deterministic run IDs", () => {
  assert.equal(
    createRunId({
      repo: "ShannonBrayNC/echocode-platform",
      issueNumber: 44,
      timestamp: "2026-05-29T05:45:00Z"
    }),
    "20260529054500-shannonbraync-echocode-platform-44"
  );
});

test("builds run artifacts with expected shape", () => {
  const report = createEchoCodexRunReport({
    repo: "ShannonBrayNC/echocode-platform",
    branch: "feature/reporting",
    selectedIssue: {
      repo: "ShannonBrayNC/echocode-platform",
      number: 44,
      title: "Generate run reports",
      url: "https://github.com/ShannonBrayNC/echocode-platform/issues/44"
    },
    policyDecision,
    actor: "christina",
    timestamp: "2026-05-29T05:45:00Z",
    riskLevel: "medium",
    validationStatus: "preview",
    nextAction: "human-review",
    planMarkdown: "# Plan\n\nUse ghp_abcdefghijklmnopqrstuvwxyz1234567890 token? no.",
    patchPreviewDiff: "diff --git a/file b/file\n+API_KEY=abc123abc123abc123abc123abc123abc123",
    validationReport
  });

  const bundle = buildRunArtifacts(report);

  assert.equal(bundle.runDirectory, "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44");
  assert.deepEqual(
    bundle.artifacts.map((artifact) => artifact.path).sort(),
    [
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/index-entry.json",
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/patch-preview.diff",
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/plan.md",
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/run.json",
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/summary.md",
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/validation.json",
      "reports/echocodex/runs/20260529054500-shannonbraync-echocode-platform-44/validation.md"
    ]
  );

  const runJson = bundle.artifacts.find((artifact) => artifact.path.endsWith("run.json"));
  assert.ok(runJson);
  assert.match(runJson.content, /Generate run reports/);
  assert.doesNotMatch(runJson.content, /super-secret-value/);
  assert.doesNotMatch(runJson.content, /abcdefghijklmnopqrstuvwxyz1234567890/);
  assert.match(runJson.content, /\[REDACTED/);
});

test("redacts sensitive strings recursively", () => {
  const redacted = redactSensitiveValues({
    nested: {
      value: "Authorization: Bearer abcdefghijklmnopqrstuvwxyz1234567890 TOKEN=my-secret-value"
    }
  });

  assert.equal(redacted.nested.value, "Authorization: Bearer [REDACTED] TOKEN=[REDACTED]");
});

test("summary contains policy decision and next action", () => {
  const report = createEchoCodexRunReport({
    repo: "ShannonBrayNC/echocode-platform",
    selectedIssue: {
      repo: "ShannonBrayNC/echocode-platform",
      number: 44,
      title: "Generate run reports"
    },
    policyDecision,
    actor: "christina",
    timestamp: "2026-05-29T05:45:00Z",
    nextAction: "human-review"
  });

  assert.match(report.summaryMarkdown, /Policy decision: requires-human-approval/);
  assert.match(report.summaryMarkdown, /Next action: human-review/);
});
