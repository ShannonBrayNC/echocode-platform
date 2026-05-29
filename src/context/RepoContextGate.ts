import {
  REQUIRED_REPO_CONTEXT_FIELDS,
  type RepoContextGateResult,
  type RepoContextInput,
  type RepoContextWarning,
  type RequiredRepoContextField
} from "./types.js";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function getMissingInputs(input: RepoContextInput): RequiredRepoContextField[] {
  return REQUIRED_REPO_CONTEXT_FIELDS.filter((field) => {
    if (field === "repositoryName") {
      return !hasText(input.repositoryName);
    }

    if (field === "fileTree") {
      return !hasItems(input.fileTree);
    }

    if (field === "issueObjective") {
      return !hasText(input.issueObjective);
    }

    return false;
  });
}

function getWarnings(input: RepoContextInput): RepoContextWarning[] {
  const warnings: RepoContextWarning[] = [];

  if (!hasText(input.currentBranch)) {
    warnings.push({
      code: "missing-current-branch",
      message: "Current branch was not provided. EchoCodex can plan, but branch safety cannot be fully evaluated."
    });
  }

  if (!input.packageMetadata || Object.keys(input.packageMetadata).length === 0) {
    warnings.push({
      code: "missing-package-metadata",
      message: "Package/build metadata was not provided. Validation command discovery may be incomplete."
    });
  }

  if (!hasItems(input.testCommands)) {
    warnings.push({
      code: "missing-test-commands",
      message: "No test commands were provided. Christina should treat validation as incomplete until tests are discovered."
    });
  }

  if (!hasItems(input.buildCommands)) {
    warnings.push({
      code: "missing-build-commands",
      message: "No build commands were provided. Build validation may be unavailable."
    });
  }

  return warnings;
}

function buildRecommendedNextPrompt(missingInputs: string[]): string | undefined {
  if (missingInputs.length === 0) {
    return undefined;
  }

  const missingList = missingInputs.map((input) => `- ${input}`).join("\n");

  return [
    "EchoCodex needs more repository context before it can plan or generate code.",
    "Please provide:",
    missingList
  ].join("\n");
}

export function evaluateRepoContext(input: RepoContextInput): RepoContextGateResult {
  const missingInputs = getMissingInputs(input);
  const warnings = getWarnings(input);

  return {
    ready: missingInputs.length === 0,
    missingInputs,
    warnings,
    recommendedNextPrompt: buildRecommendedNextPrompt(missingInputs)
  };
}

export function assertRepoContextReady(input: RepoContextInput): RepoContextGateResult {
  const result = evaluateRepoContext(input);

  if (!result.ready) {
    return result;
  }

  return result;
}
