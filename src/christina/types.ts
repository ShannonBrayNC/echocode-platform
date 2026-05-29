import type { RepoInventory } from "../repo/RepoInventory.js";
import type { RunnerIssue } from "../github/types.js";

export type SprintBlocker = {
  code: string;
  message: string;
};

export type SprintTask = {
  order: number;
  title: string;
  details: string;
};

export type SprintPlan = {
  mode: "dryRun";
  objective: string;
  selectedIssue: RunnerIssue;
  repoInventory: Pick<RepoInventory, "repositoryName" | "projectTypes" | "manifests" | "buildHints" | "testHints" | "sensitivePaths">;
  impactedFiles: string[];
  orderedTasks: SprintTask[];
  riskNotes: string[];
  validationCommands: string[];
  rollbackPlan: string[];
  blockers: SprintBlocker[];
  ready: boolean;
  markdown: string;
};

export type SelectNextIssueInput = {
  issues: RunnerIssue[];
  explicitIssue?: {
    repo: string;
    number: number;
  };
  blockedLabels?: string[];
};

export type SelectNextIssueResult = {
  selectedIssue?: RunnerIssue;
  blockers: SprintBlocker[];
};

export type PlanSprintInput = {
  issue: RunnerIssue;
  repoInventory: RepoInventory;
  currentBranch?: string;
};
