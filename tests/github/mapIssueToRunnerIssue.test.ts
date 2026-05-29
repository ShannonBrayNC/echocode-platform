import assert from "node:assert/strict";
import test from "node:test";

import { calculateIssuePriority, isPullRequestIssue, mapIssueToRunnerIssue } from "../../src/github/mapIssueToRunnerIssue.js";

test("mapper excludes pull request shaped issues", () => {
  assert.equal(isPullRequestIssue({ number: 1, pull_request: { url: "https://api.github.com/pulls/1" } }), true);
  assert.equal(isPullRequestIssue({ number: 2 }), false);
});

test("mapper normalizes GitHub issue to RunnerIssue", () => {
  const issue = mapIssueToRunnerIssue({
    repo: "ShannonBrayNC/echocode-platform",
    repoPriority: 100,
    issue: {
      number: 39,
      title: " Implement GitHub issue ingestion ",
      body: "Body",
      labels: [{ name: "echocodex" }, "priority:high", null],
      updated_at: "2026-05-29T00:00:00Z",
      html_url: "https://github.com/ShannonBrayNC/echocode-platform/issues/39"
    },
    priorityLabels: {
      echocodex: 15,
      "priority:high": 25
    }
  });

  assert.deepEqual(issue, {
    repo: "ShannonBrayNC/echocode-platform",
    number: 39,
    title: "Implement GitHub issue ingestion",
    body: "Body",
    labels: ["echocodex", "priority:high"],
    priority: 125,
    updatedAt: "2026-05-29T00:00:00Z",
    url: "https://github.com/ShannonBrayNC/echocode-platform/issues/39",
    sourceSystem: "github"
  });
});

test("priority uses highest matching label boost", () => {
  assert.equal(
    calculateIssuePriority(80, ["priority:medium", "priority:critical"], {
      "priority:medium": 10,
      "priority:critical": 50
    }),
    130
  );
});
