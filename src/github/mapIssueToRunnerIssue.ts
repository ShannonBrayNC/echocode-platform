import type { GitHubIssueLike, RunnerIssue } from "./types.js";

function normalizeLabels(labels: GitHubIssueLike["labels"]): string[] {
  if (!labels) {
    return [];
  }

  return labels
    .map((label) => {
      if (!label) {
        return undefined;
      }

      if (typeof label === "string") {
        return label;
      }

      return label.name ?? undefined;
    })
    .filter((label): label is string => Boolean(label && label.trim().length > 0))
    .map((label) => label.trim())
    .sort((a, b) => a.localeCompare(b));
}

export function isPullRequestIssue(issue: GitHubIssueLike): boolean {
  return Boolean(issue.pull_request);
}

export function calculateIssuePriority(
  repoPriority: number,
  labels: string[],
  priorityLabels: Record<string, number> = {}
): number {
  const labelBoost = labels.reduce((highest, label) => {
    const boost = priorityLabels[label] ?? priorityLabels[label.toLowerCase()] ?? 0;
    return Math.max(highest, boost);
  }, 0);

  return repoPriority + labelBoost;
}

export function mapIssueToRunnerIssue(params: {
  repo: string;
  repoPriority: number;
  issue: GitHubIssueLike;
  priorityLabels?: Record<string, number>;
}): RunnerIssue {
  const labels = normalizeLabels(params.issue.labels);

  return {
    repo: params.repo,
    number: params.issue.number,
    title: params.issue.title?.trim() || `(untitled issue #${params.issue.number})`,
    body: params.issue.body ?? "",
    labels,
    priority: calculateIssuePriority(params.repoPriority, labels, params.priorityLabels),
    updatedAt: params.issue.updated_at ?? new Date(0).toISOString(),
    url: params.issue.html_url ?? `https://github.com/${params.repo}/issues/${params.issue.number}`,
    sourceSystem: "github"
  };
}
