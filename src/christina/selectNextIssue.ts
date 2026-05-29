import type { RunnerIssue } from "../github/types.js";
import type { SelectNextIssueInput, SelectNextIssueResult, SprintBlocker } from "./types.js";

function hasBlockedLabel(issue: RunnerIssue, blockedLabels: string[] = []): boolean {
  const blocked = new Set(blockedLabels.map((label) => label.toLowerCase()));
  return issue.labels.some((label) => blocked.has(label.toLowerCase()));
}

function sortIssues(issues: RunnerIssue[]): RunnerIssue[] {
  return [...issues].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    const updatedComparison = b.updatedAt.localeCompare(a.updatedAt);

    if (updatedComparison !== 0) {
      return updatedComparison;
    }

    const repoComparison = a.repo.localeCompare(b.repo);

    if (repoComparison !== 0) {
      return repoComparison;
    }

    return a.number - b.number;
  });
}

export function selectNextIssue(input: SelectNextIssueInput): SelectNextIssueResult {
  const blockers: SprintBlocker[] = [];

  if (input.issues.length === 0) {
    return {
      blockers: [
        {
          code: "no-issues",
          message: "No RunnerIssue items were provided for Christina to select."
        }
      ]
    };
  }

  const eligibleIssues = input.issues.filter((issue) => !hasBlockedLabel(issue, input.blockedLabels));

  if (eligibleIssues.length === 0) {
    return {
      blockers: [
        {
          code: "all-issues-blocked",
          message: "All candidate issues are blocked by configured labels."
        }
      ]
    };
  }

  if (input.explicitIssue) {
    const selectedIssue = eligibleIssues.find(
      (issue) => issue.repo === input.explicitIssue?.repo && issue.number === input.explicitIssue.number
    );

    if (!selectedIssue) {
      return {
        blockers: [
          {
            code: "explicit-issue-not-eligible",
            message: `Explicit issue ${input.explicitIssue.repo}#${input.explicitIssue.number} was not found or is blocked.`
          }
        ]
      };
    }

    return { selectedIssue, blockers };
  }

  return {
    selectedIssue: sortIssues(eligibleIssues)[0],
    blockers
  };
}
