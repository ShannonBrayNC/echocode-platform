import type {
  EchoCodexMode,
  EchoCodexPolicy,
  PathRule,
  PolicyGateInput,
  PolicyGateResult,
  PolicyReason,
  RepoPolicyOverride
} from "./EchoCodexPolicy.js";

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function globToRegExp(pattern: string): RegExp {
  const normalized = normalizePath(pattern);
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR__/g, ".*");

  return new RegExp(`^${escaped}$`, "i");
}

function matchesRule(path: string, rule: PathRule): boolean {
  return globToRegExp(rule.pattern).test(normalizePath(path));
}

function findRepoOverride(policy: EchoCodexPolicy, repo: string): RepoPolicyOverride | undefined {
  return policy.repoOverrides?.find((override) => override.repo.toLowerCase() === repo.toLowerCase());
}

function mergedAllowedModes(policy: EchoCodexPolicy, override?: RepoPolicyOverride): EchoCodexMode[] {
  return override?.allowedModes ?? policy.allowedModes;
}

function mergedProtectedBranches(policy: EchoCodexPolicy, override?: RepoPolicyOverride): string[] {
  return override?.protectedBranches ?? policy.protectedBranches;
}

function mergedAllowPaths(policy: EchoCodexPolicy, override?: RepoPolicyOverride): PathRule[] {
  return override?.allowPaths ?? policy.allowPaths;
}

function mergedDenyPaths(policy: EchoCodexPolicy, override?: RepoPolicyOverride): PathRule[] {
  return [...policy.denyPaths, ...(override?.denyPaths ?? [])];
}

function humanApprovalRequired(policy: EchoCodexPolicy, mode: EchoCodexMode, override?: RepoPolicyOverride): boolean {
  if (mode === "dryRun") {
    return false;
  }

  return override?.requireHumanApprovalBeyondDryRun ?? policy.requireHumanApprovalBeyondDryRun;
}

function addReason(reasons: PolicyReason[], code: string, message: string): void {
  reasons.push({ code, message });
}

function evaluatePaths(params: {
  changedPaths: string[];
  allowPaths: PathRule[];
  denyPaths: PathRule[];
  reasons: PolicyReason[];
}): void {
  for (const rawPath of params.changedPaths) {
    const path = normalizePath(rawPath);
    const denyRule = params.denyPaths.find((rule) => matchesRule(path, rule));

    if (denyRule) {
      addReason(
        params.reasons,
        "denied-path",
        `${path} is denied by policy rule ${denyRule.pattern}${denyRule.reason ? `: ${denyRule.reason}` : "."}`
      );
      continue;
    }

    if (params.allowPaths.length > 0 && !params.allowPaths.some((rule) => matchesRule(path, rule))) {
      addReason(params.reasons, "path-not-allowed", `${path} does not match any allowed path rule.`);
    }
  }
}

export function evaluatePolicyGate(input: PolicyGateInput): PolicyGateResult {
  const override = findRepoOverride(input.policy, input.repo);
  const effectiveMode = input.requestedMode ?? input.policy.defaultMode ?? "dryRun";
  const reasons: PolicyReason[] = [];
  const allowedModes = mergedAllowedModes(input.policy, override);
  const protectedBranches = mergedProtectedBranches(input.policy, override).map((branch) => branch.toLowerCase());
  const requireApproval = humanApprovalRequired(input.policy, effectiveMode, override);
  const allowAutoMerge = override?.allowAutoMerge ?? input.policy.allowAutoMerge;

  if (!allowedModes.includes(effectiveMode)) {
    addReason(reasons, "mode-not-allowed", `${effectiveMode} is not allowed by policy.`);
  }

  if (input.branch && protectedBranches.includes(input.branch.toLowerCase()) && effectiveMode !== "dryRun") {
    addReason(reasons, "protected-branch", `Direct ${effectiveMode} activity is blocked on protected branch ${input.branch}.`);
  }

  evaluatePaths({
    changedPaths: input.changedPaths ?? [],
    allowPaths: mergedAllowPaths(input.policy, override),
    denyPaths: mergedDenyPaths(input.policy, override),
    reasons
  });

  if (effectiveMode === "autoMerge") {
    if (!allowAutoMerge) {
      addReason(reasons, "auto-merge-disabled", "Auto-merge is disabled by policy.");
    }

    if (!input.validationPassed) {
      addReason(reasons, "validation-required", "Auto-merge requires passing validation results.");
    }
  }

  const blockedReasons = reasons.filter((reason) =>
    ["mode-not-allowed", "protected-branch", "denied-path", "path-not-allowed", "auto-merge-disabled", "validation-required"].includes(reason.code)
  );

  if (blockedReasons.length > 0) {
    return {
      decision: "block",
      effectiveMode,
      repo: input.repo,
      branch: input.branch,
      reasons,
      humanApprovalRequired: requireApproval
    };
  }

  if (requireApproval && !input.humanApproval) {
    return {
      decision: "requires-human-approval",
      effectiveMode,
      repo: input.repo,
      branch: input.branch,
      reasons: [
        ...reasons,
        {
          code: "human-approval-required",
          message: `${effectiveMode} requires human approval before execution.`
        }
      ],
      humanApprovalRequired: true
    };
  }

  return {
    decision: "allow",
    effectiveMode,
    repo: input.repo,
    branch: input.branch,
    reasons,
    humanApprovalRequired: false
  };
}
