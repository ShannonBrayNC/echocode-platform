export type RunnerIssue = {
  repo: string;
  number: number;
  title: string;
  body: string;
  labels: string[];
  priority: number;
  updatedAt: string;
  url: string;
  sourceSystem: "github";
};

export type GitHubIssueLike = {
  number: number;
  title?: string | null;
  body?: string | null;
  labels?: Array<string | { name?: string | null } | null>;
  updated_at?: string | null;
  html_url?: string | null;
  pull_request?: unknown;
  state?: string | null;
};

export type RepoPriorityConfig = {
  repo: string;
  priority: number;
  labels?: string[];
};

export type EchoCodexRunnerConfig = {
  repoPriority: RepoPriorityConfig[];
  blockedLabels?: string[];
  priorityLabels?: Record<string, number>;
  maxItems?: number;
};

export type IssueIngestionResult = {
  issues: RunnerIssue[];
  warnings: string[];
};
