import { evaluateRepoContext } from "../context/RepoContextGate.js";
import type { RepoInventory } from "../repo/RepoInventory.js";
import type { PlanSprintInput, SprintBlocker, SprintPlan, SprintTask } from "./types.js";

function inferImpactedFiles(issueText: string, inventory: RepoInventory): string[] {
  const lowerText = issueText.toLowerCase();
  const candidates = inventory.files.filter((file) => {
    const lowerFile = file.toLowerCase();
    const baseName = lowerFile.split("/").at(-1) ?? lowerFile;

    return lowerText.includes(lowerFile) || lowerText.includes(baseName);
  });

  if (candidates.length > 0) {
    return candidates.sort((a, b) => a.localeCompare(b));
  }

  return [
    "src/**/*.ts",
    "tests/**/*.test.ts",
    "README.md"
  ];
}

function getValidationCommands(inventory: RepoInventory): string[] {
  return Array.from(new Set([...inventory.buildHints, ...inventory.testHints, "npm run typecheck"].filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function getRiskNotes(input: PlanSprintInput, blockers: SprintBlocker[]): string[] {
  const notes: string[] = [
    "Mode is dryRun. Do not create branches, commits, pull requests, merges, or live writes from this plan."
  ];

  if (!input.currentBranch) {
    notes.push("Current branch is unknown. Branch safety cannot be fully evaluated.");
  }

  if (input.repoInventory.sensitivePaths.length > 0) {
    notes.push("Repository inventory contains sensitive paths. Do not read or log secret values.");
  }

  if (input.repoInventory.testHints.length === 0) {
    notes.push("No test commands were discovered. Treat validation as incomplete until tests are identified.");
  }

  if (blockers.length > 0) {
    notes.push("Blockers are present. Christina must not execute implementation work until blockers are resolved.");
  }

  return notes;
}

function getOrderedTasks(): SprintTask[] {
  return [
    {
      order: 1,
      title: "Confirm repository context",
      details: "Verify repository name, branch, file tree, issue objective, manifests, and validation hints before planning implementation."
    },
    {
      order: 2,
      title: "Inspect impacted files",
      details: "Review the files inferred from the issue objective and repository inventory. Expand scope only when the repo evidence supports it."
    },
    {
      order: 3,
      title: "Prepare proposed changes",
      details: "Generate a minimal patch plan with rationale, validation commands, and rollback notes. Keep all changes in dry-run until policy gates allow writes."
    },
    {
      order: 4,
      title: "Validate safely",
      details: "Run or preview build, test, and typecheck commands. Capture failures as blockers instead of forcing progress."
    },
    {
      order: 5,
      title: "Report outcome",
      details: "Write a human-readable and machine-readable sprint summary for Christina and the operator."
    }
  ];
}

function getRollbackPlan(): string[] {
  return [
    "Because this plan is dry-run only, rollback is to discard the generated plan/report artifacts.",
    "If future write modes are enabled, revert the feature branch or close the generated pull request without merge.",
    "Do not modify the default branch directly from this planner."
  ];
}

function renderMarkdown(plan: Omit<SprintPlan, "markdown">): string {
  const blockers = plan.blockers.length > 0
    ? plan.blockers.map((blocker) => `- ${blocker.code}: ${blocker.message}`).join("\n")
    : "- None";

  const impactedFiles = plan.impactedFiles.map((file) => `- ${file}`).join("\n");
  const tasks = plan.orderedTasks.map((task) => `${task.order}. ${task.title}: ${task.details}`).join("\n");
  const validations = plan.validationCommands.length > 0
    ? plan.validationCommands.map((command) => `- \`${command}\``).join("\n")
    : "- No validation commands discovered";
  const risks = plan.riskNotes.map((risk) => `- ${risk}`).join("\n");
  const rollback = plan.rollbackPlan.map((step) => `- ${step}`).join("\n");

  return `# Christina Sprint Plan\n\n## Objective\n${plan.objective}\n\n## Selected issue\n${plan.selectedIssue.repo}#${plan.selectedIssue.number}: ${plan.selectedIssue.title}\n\n## Ready\n${plan.ready ? "Yes" : "No"}\n\n## Blockers\n${blockers}\n\n## Impacted files\n${impactedFiles}\n\n## Ordered tasks\n${tasks}\n\n## Validation commands\n${validations}\n\n## Risk notes\n${risks}\n\n## Rollback plan\n${rollback}\n`;
}

export function planSprint(input: PlanSprintInput): SprintPlan {
  const objective = `Implement ${input.issue.repo}#${input.issue.number}: ${input.issue.title}`;
  const repoContext = evaluateRepoContext({
    repositoryName: input.repoInventory.repositoryName ?? input.issue.repo,
    currentBranch: input.currentBranch,
    fileTree: input.repoInventory.files,
    packageMetadata: {
      projectTypes: input.repoInventory.projectTypes,
      manifests: input.repoInventory.manifests,
      packageManagers: input.repoInventory.packageManagers
    },
    testCommands: input.repoInventory.testHints,
    buildCommands: input.repoInventory.buildHints,
    issueObjective: objective,
    issueNumber: input.issue.number
  });

  const blockers: SprintBlocker[] = repoContext.ready
    ? []
    : repoContext.missingInputs.map((missingInput) => ({
        code: `missing-${missingInput}`,
        message: `Repository context is missing required input: ${missingInput}.`
      }));

  if (input.repoInventory.testHints.length === 0) {
    blockers.push({
      code: "missing-tests",
      message: "No test commands were discovered. Christina should not mark implementation complete without validation coverage."
    });
  }

  if (input.issue.labels.some((label) => label.toLowerCase().includes("unsafe") || label.toLowerCase().includes("live-write"))) {
    blockers.push({
      code: "unsafe-scope",
      message: "Issue labels indicate unsafe or live-write scope. Policy gates must approve before execution."
    });
  }

  const planWithoutMarkdown: Omit<SprintPlan, "markdown"> = {
    mode: "dryRun",
    objective,
    selectedIssue: input.issue,
    repoInventory: {
      repositoryName: input.repoInventory.repositoryName,
      projectTypes: input.repoInventory.projectTypes,
      manifests: input.repoInventory.manifests,
      buildHints: input.repoInventory.buildHints,
      testHints: input.repoInventory.testHints,
      sensitivePaths: input.repoInventory.sensitivePaths
    },
    impactedFiles: inferImpactedFiles(`${input.issue.title}\n${input.issue.body}`, input.repoInventory),
    orderedTasks: getOrderedTasks(),
    riskNotes: getRiskNotes(input, blockers),
    validationCommands: getValidationCommands(input.repoInventory),
    rollbackPlan: getRollbackPlan(),
    blockers,
    ready: blockers.length === 0
  };

  return {
    ...planWithoutMarkdown,
    markdown: renderMarkdown(planWithoutMarkdown)
  };
}
