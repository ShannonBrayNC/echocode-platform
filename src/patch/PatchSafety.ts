import type {
  FileChange,
  PatchSafetyFinding,
  PatchSafetyOptions,
  PatchSafetyResult,
  ProposedPatch
} from "./PatchModel.js";

const SECRET_PATTERNS = [
  /(^|\/)\.env(\.|$)?/i,
  /secret/i,
  /password/i,
  /token/i,
  /credential/i,
  /private[-_]?key/i,
  /\.pem$/i,
  /\.pfx$/i,
  /\.key$/i,
  /\.crt$/i
];

const LOCKFILE_PATTERNS = [
  /(^|\/)package-lock\.json$/i,
  /(^|\/)pnpm-lock\.yaml$/i,
  /(^|\/)yarn\.lock$/i,
  /(^|\/)poetry\.lock$/i,
  /(^|\/)Pipfile\.lock$/i
];

const BRANCH_PROTECTION_PATTERNS = [
  /(^|\/)branch-protection\.(json|ya?ml)$/i,
  /(^|\/)CODEOWNERS$/i,
  /(^|\/)settings\.ya?ml$/i,
  /(^|\/)repository-rules(\/|\.)/i
];

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function pathsForChange(change: FileChange): string[] {
  return [change.path, change.newPath].filter((path): path is string => Boolean(path)).map(normalizePath);
}

function matchesAny(path: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

function addFinding(findings: PatchSafetyFinding[], finding: PatchSafetyFinding): void {
  findings.push(finding);
}

function evaluateChange(change: FileChange, options: PatchSafetyOptions, findings: PatchSafetyFinding[]): void {
  if (!change.rationale.trim()) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-change-rationale",
      path: change.path,
      message: "Each file change must include rationale."
    });
  }

  if (change.action === "rename" && !change.newPath) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-rename-target",
      path: change.path,
      message: "Rename changes must include newPath."
    });
  }

  if ((change.action === "create" || change.action === "update") && change.after === undefined) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-after-content",
      path: change.path,
      message: `${change.action} changes must include after content.`
    });
  }

  if ((change.action === "update" || change.action === "delete" || change.action === "rename") && change.before === undefined) {
    addFinding(findings, {
      severity: "warning",
      code: "missing-before-content",
      path: change.path,
      message: `${change.action} changes should include before content so EchoCodex can render an accurate preview diff.`
    });
  }

  for (const path of pathsForChange(change)) {
    if (matchesAny(path, SECRET_PATTERNS)) {
      addFinding(findings, {
        severity: "blocked",
        code: "protected-secret-path",
        path,
        message: "Patch touches a secret, credential, token, certificate, or key path."
      });
    }

    if (matchesAny(path, LOCKFILE_PATTERNS) && !options.allowLockfileChanges) {
      addFinding(findings, {
        severity: "blocked",
        code: "protected-lockfile",
        path,
        message: "Patch touches a lockfile. Lockfile changes require explicit policy approval."
      });
    }

    if (path.startsWith(".github/workflows/") && !options.allowWorkflowChanges) {
      addFinding(findings, {
        severity: "blocked",
        code: "protected-workflow",
        path,
        message: "Patch touches a GitHub Actions workflow. Workflow changes require explicit policy approval."
      });
    }

    if (matchesAny(path, BRANCH_PROTECTION_PATTERNS) && !options.allowBranchProtectionChanges) {
      addFinding(findings, {
        severity: "blocked",
        code: "protected-branch-policy",
        path,
        message: "Patch touches branch protection, CODEOWNERS, repository rules, or repository settings."
      });
    }
  }
}

function validatePatchMetadata(patch: ProposedPatch, findings: PatchSafetyFinding[]): void {
  if (!patch.issue.repo.trim() || patch.issue.number <= 0) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-issue-reference",
      message: "Patch must include a valid issue repo and issue number."
    });
  }

  if (!patch.rationale.trim()) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-patch-rationale",
      message: "Patch must include an overall rationale."
    });
  }

  if (patch.validationCommands.length === 0) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-validation-commands",
      message: "Patch must include validation commands."
    });
  }

  if (patch.rollbackNotes.length === 0) {
    addFinding(findings, {
      severity: "blocked",
      code: "missing-rollback-notes",
      message: "Patch must include rollback notes."
    });
  }

  if (patch.changes.length === 0) {
    addFinding(findings, {
      severity: "warning",
      code: "empty-patch",
      message: "Patch contains no file changes."
    });
  }
}

export function evaluatePatchSafety(patch: ProposedPatch, options: PatchSafetyOptions = {}): PatchSafetyResult {
  const findings: PatchSafetyFinding[] = [];
  const mergedOptions: PatchSafetyOptions = {
    ...options,
    autoApprovalMode: options.autoApprovalMode ?? patch.autoApproval?.mode ?? "disabled"
  };

  validatePatchMetadata(patch, findings);

  for (const change of patch.changes) {
    evaluateChange(change, mergedOptions, findings);
  }

  const hasBlockedFindings = findings.some((finding) => finding.severity === "blocked");
  const hasWarnings = findings.some((finding) => finding.severity === "warning");
  const safe = !hasBlockedFindings;
  const autoApproved = safe && !hasWarnings && mergedOptions.autoApprovalMode === "safeOnly";

  return {
    safe,
    approvalState: hasBlockedFindings ? "blocked" : autoApproved ? "approved" : "requires-human-review",
    autoApproved,
    findings
  };
}
