import assert from "node:assert/strict";
import test from "node:test";

import { executeLiveAutomation, type GitHubAutomationClient } from "../../src/github/GitHubLiveAutomation.js";
import type { PolicyGateResult } from "../../src/policy/EchoCodexPolicy.js";

function allowedPolicy(mode: PolicyGateResult["effectiveMode"] = "openPullRequest"): PolicyGateResult {
  return {
    decision: "allow",
    effectiveMode: mode,
    repo: "ShannonBrayNC/echocode-platform",
    branch: "echocodex/test",
    reasons: [],
    humanApprovalRequired: false
  };
}

function blockedPolicy(): PolicyGateResult {
  return {
    decision: "block",
    effectiveMode: "openPullRequest",
    repo: "ShannonBrayNC/echocode-platform",
    branch: "main",
    reasons: [{ code: "protected-branch", message: "Protected branch write blocked." }],
    humanApprovalRequired: true
  };
}

class RecordingClient implements GitHubAutomationClient {
  readonly calls: string[] = [];

  async createBranch(): Promise<void> {
    this.calls.push("createBranch");
  }

  async upsertFile(): Promise<void> {
    this.calls.push("upsertFile");
  }

  async openPullRequest(): Promise<{ number: number; url: string; draft: boolean }> {
    this.calls.push("openPullRequest");
    return {
      number: 123,
      url: "https://github.com/ShannonBrayNC/echocode-platform/pull/123",
      draft: true
    };
  }
}

test("live automation creates branch, writes files, and opens draft PR when policy allows", async () => {
  const client = new RecordingClient();
  const result = await executeLiveAutomation({
    policyDecision: allowedPolicy(),
    client,
    request: {
      repo: "ShannonBrayNC/echocode-platform",
      baseBranch: "main",
      workingBranch: "echocodex/test",
      changes: [
        {
          path: "docs/live-automation.md",
          content: "# Live automation test\n",
          message: "Add live automation test doc"
        }
      ],
      pullRequest: {
        title: "Verify live automation",
        draft: true
      }
    }
  });

  assert.deepEqual(client.calls, ["createBranch", "upsertFile", "openPullRequest"]);
  assert.deepEqual(result.committedPaths, ["docs/live-automation.md"]);
  assert.equal(result.pullRequest?.number, 123);
  assert.equal(result.pullRequest?.draft, true);
});

test("live automation refuses to run when policy blocks", async () => {
  const client = new RecordingClient();

  await assert.rejects(
    executeLiveAutomation({
      policyDecision: blockedPolicy(),
      client,
      request: {
        repo: "ShannonBrayNC/echocode-platform",
        baseBranch: "main",
        workingBranch: "echocodex/test",
        changes: [
          {
            path: "docs/live-automation.md",
            content: "# Live automation test\n",
            message: "Add live automation test doc"
          }
        ],
        pullRequest: {
          title: "Verify live automation",
          draft: true
        }
      }
    }),
    /Policy gate did not allow openPullRequest/
  );

  assert.deepEqual(client.calls, []);
});

test("write-only automation refuses to run under createBranch-only mode", async () => {
  const client = new RecordingClient();

  await assert.rejects(
    executeLiveAutomation({
      policyDecision: allowedPolicy("createBranch"),
      client,
      request: {
        repo: "ShannonBrayNC/echocode-platform",
        baseBranch: "main",
        workingBranch: "echocodex/test",
        changes: [
          {
            path: "docs/live-automation.md",
            content: "# Live automation test\n",
            message: "Add live automation test doc"
          }
        ]
      }
    }),
    /Policy mode createBranch cannot write files/
  );
});
