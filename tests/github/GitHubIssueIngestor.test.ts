import assert from "node:assert/strict";
import test from "node:test";

import { getGitHubToken, ingestGitHubIssues, type GitHubIssueClient } from "../../src/github/GitHubIssueIngestor.js";
import type { EchoCodexRunnerConfig } from "../../src/github/types.js";

const config: EchoCodexRunnerConfig = {
  repoPriority: [
    { repo: "ShannonBrayNC/echocode-platform", priority: 100 },
    { repo: "ShannonBrayNC/OpsHelm", priority: 90 }
  ],
  blockedLabels: ["blocked"],
  priorityLabels: {
    "priority:high": 25,
    echocodex: 15
  },
  maxItems: 10
};

test("token lookup prefers GITHUB_TOKEN over GH_PAT", () => {
  assert.equal(getGitHubToken({ GITHUB_TOKEN: "github-token", GH_PAT: "pat-token" }), "github-token");
  assert.equal(getGitHubToken({ GH_PAT: "pat-token" }), "pat-token");
  assert.equal(getGitHubToken({}), undefined);
});

test("ingestor returns warning when no token or client exists", async () => {
  const result = await ingestGitHubIssues({ config, env: {} });

  assert.deepEqual(result.issues, []);
  assert.match(result.warnings[0], /Missing GitHub token/);
});

test("ingestor excludes PRs and blocked labels", async () => {
  const client: GitHubIssueClient = {
    async listOpenIssues(repo) {
      if (repo === "ShannonBrayNC/echocode-platform") {
        return [
          {
            number: 39,
            title: "GitHub ingestion",
            labels: [{ name: "echocodex" }, { name: "priority:high" }],
            updated_at: "2026-05-29T02:00:00Z",
            html_url: "https://github.com/ShannonBrayNC/echocode-platform/issues/39"
          },
          {
            number: 100,
            title: "PR shaped issue",
            pull_request: { url: "https://api.github.com/pulls/100" },
            labels: [],
            updated_at: "2026-05-29T03:00:00Z"
          },
          {
            number: 101,
            title: "Blocked issue",
            labels: [{ name: "blocked" }],
            updated_at: "2026-05-29T04:00:00Z"
          }
        ];
      }

      return [
        {
          number: 1,
          title: "OpsHelm follow-up",
          labels: [],
          updated_at: "2026-05-29T05:00:00Z"
        }
      ];
    }
  };

  const result = await ingestGitHubIssues({ config, client, env: {} });

  assert.equal(result.warnings.length, 0);
  assert.deepEqual(
    result.issues.map((issue) => `${issue.repo}#${issue.number}`),
    ["ShannonBrayNC/echocode-platform#39", "ShannonBrayNC/OpsHelm#1"]
  );
  assert.equal(result.issues[0].priority, 125);
});

test("ingestor records per-repo warnings and continues", async () => {
  const client: GitHubIssueClient = {
    async listOpenIssues(repo) {
      if (repo === "ShannonBrayNC/echocode-platform") {
        throw new Error("rate limited");
      }

      return [
        {
          number: 1,
          title: "OpsHelm issue",
          labels: [],
          updated_at: "2026-05-29T05:00:00Z"
        }
      ];
    }
  };

  const result = await ingestGitHubIssues({ config, client, env: {} });

  assert.deepEqual(result.issues.map((issue) => issue.number), [1]);
  assert.match(result.warnings[0], /rate limited/);
});
