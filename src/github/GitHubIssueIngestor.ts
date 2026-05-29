import { Octokit } from "@octokit/rest";

import { isPullRequestIssue, mapIssueToRunnerIssue } from "./mapIssueToRunnerIssue.js";
import type { EchoCodexRunnerConfig, GitHubIssueLike, IssueIngestionResult, RunnerIssue } from "./types.js";

export type GitHubIssueClient = {
  listOpenIssues(repo: string): Promise<GitHubIssueLike[]>;
};

export class OctokitIssueClient implements GitHubIssueClient {
  private readonly octokit: Octokit;

  public constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  public async listOpenIssues(repo: string): Promise<GitHubIssueLike[]> {
    const [owner, repoName] = repo.split("/");

    if (!owner || !repoName) {
      throw new Error(`Invalid GitHub repository name: ${repo}`);
    }

    const issues = await this.octokit.paginate(this.octokit.rest.issues.listForRepo, {
      owner,
      repo: repoName,
      state: "open",
      per_page: 100
    });

    return issues as GitHubIssueLike[];
  }
}

export function getGitHubToken(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.GITHUB_TOKEN || env.GH_PAT;
}

function hasBlockedLabel(issue: GitHubIssueLike, blockedLabels: string[] = []): boolean {
  const blocked = new Set(blockedLabels.map((label) => label.toLowerCase()));

  return (issue.labels ?? []).some((label) => {
    const labelName = typeof label === "string" ? label : label?.name;
    return Boolean(labelName && blocked.has(labelName.toLowerCase()));
  });
}

function sortRunnerIssues(issues: RunnerIssue[], repoOrder: Map<string, number>): RunnerIssue[] {
  return [...issues].sort((a, b) => {
    const repoComparison = (repoOrder.get(a.repo) ?? 9999) - (repoOrder.get(b.repo) ?? 9999);

    if (repoComparison !== 0) {
      return repoComparison;
    }

    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function ingestGitHubIssues(params: {
  config: EchoCodexRunnerConfig;
  client?: GitHubIssueClient;
  env?: NodeJS.ProcessEnv;
}): Promise<IssueIngestionResult> {
  const warnings: string[] = [];
  const token = getGitHubToken(params.env);
  const client = params.client ?? (token ? new OctokitIssueClient(token) : undefined);

  if (!client) {
    return {
      issues: [],
      warnings: ["Missing GitHub token. Set GITHUB_TOKEN or GH_PAT to enable GitHub issue ingestion."]
    };
  }

  const repoOrder = new Map(params.config.repoPriority.map((repoConfig, index) => [repoConfig.repo, index]));
  const mappedIssues: RunnerIssue[] = [];

  for (const repoConfig of params.config.repoPriority) {
    try {
      const issues = await client.listOpenIssues(repoConfig.repo);

      for (const issue of issues) {
        if (isPullRequestIssue(issue)) {
          continue;
        }

        if (hasBlockedLabel(issue, params.config.blockedLabels)) {
          continue;
        }

        mappedIssues.push(
          mapIssueToRunnerIssue({
            repo: repoConfig.repo,
            repoPriority: repoConfig.priority,
            issue,
            priorityLabels: params.config.priorityLabels
          })
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to ingest ${repoConfig.repo}: ${message}`);
    }
  }

  return {
    issues: sortRunnerIssues(mappedIssues, repoOrder).slice(0, params.config.maxItems ?? mappedIssues.length),
    warnings
  };
}
