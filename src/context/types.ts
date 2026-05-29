export type RepoContextInput = {
  repositoryName?: string;
  currentBranch?: string;
  fileTree?: string[];
  packageMetadata?: Record<string, unknown>;
  testCommands?: string[];
  buildCommands?: string[];
  issueObjective?: string;
  issueNumber?: number;
};

export type RepoContextWarning = {
  code: string;
  message: string;
};

export type RepoContextGateResult = {
  ready: boolean;
  missingInputs: string[];
  warnings: RepoContextWarning[];
  recommendedNextPrompt?: string;
};

export const REQUIRED_REPO_CONTEXT_FIELDS = [
  "repositoryName",
  "fileTree",
  "issueObjective"
] as const;

export type RequiredRepoContextField = typeof REQUIRED_REPO_CONTEXT_FIELDS[number];
