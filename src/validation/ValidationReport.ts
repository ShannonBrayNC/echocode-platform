export type ValidationCommandKind = "build" | "test" | "lint" | "typecheck" | "format" | "unknown";

export type ValidationCommand = {
  kind: ValidationCommandKind;
  command: string;
  cwd: string;
  source: string;
  required: boolean;
};

export type ValidationStatus = "preview" | "passed" | "failed" | "blocked" | "warning";

export type ValidationFailureClass =
  | "none"
  | "missing-command"
  | "dependency-install"
  | "test-failure"
  | "typecheck-failure"
  | "lint-failure"
  | "build-failure"
  | "runtime-error"
  | "unknown";

export type ValidationCommandResult = {
  command: ValidationCommand;
  status: ValidationStatus;
  exitCode?: number;
  durationMs?: number;
  stdoutSummary?: string;
  stderrSummary?: string;
  failureClass: ValidationFailureClass;
};

export type ValidationReport = {
  repo: string;
  mode: "preview" | "executed";
  generatedAt: string;
  commands: ValidationCommand[];
  results: ValidationCommandResult[];
  warnings: string[];
  blocked: boolean;
  markdown: string;
};

function renderCommandTable(commands: ValidationCommand[]): string {
  if (commands.length === 0) {
    return "No validation commands resolved.";
  }

  return [
    "| Kind | Command | Required | Source |",
    "|---|---|---:|---|",
    ...commands.map((command) => `| ${command.kind} | \`${command.command}\` | ${command.required ? "yes" : "no"} | ${command.source} |`)
  ].join("\n");
}

function renderWarnings(warnings: string[]): string {
  if (warnings.length === 0) {
    return "- None";
  }

  return warnings.map((warning) => `- ${warning}`).join("\n");
}

export function renderValidationMarkdown(report: Omit<ValidationReport, "markdown">): string {
  return [
    "# EchoCodex Validation Report",
    "",
    `- Repo: ${report.repo}`,
    `- Mode: ${report.mode}`,
    `- Generated: ${report.generatedAt}`,
    `- Blocked: ${report.blocked ? "yes" : "no"}`,
    "",
    "## Commands",
    "",
    renderCommandTable(report.commands),
    "",
    "## Warnings",
    "",
    renderWarnings(report.warnings),
    ""
  ].join("\n");
}

export function createPreviewValidationReport(params: {
  repo: string;
  commands: ValidationCommand[];
  warnings: string[];
  generatedAt?: string;
}): ValidationReport {
  const reportWithoutMarkdown: Omit<ValidationReport, "markdown"> = {
    repo: params.repo,
    mode: "preview",
    generatedAt: params.generatedAt ?? new Date(0).toISOString(),
    commands: params.commands,
    results: params.commands.map((command) => ({
      command,
      status: "preview",
      failureClass: "none"
    })),
    warnings: params.warnings,
    blocked: params.commands.length === 0 || params.warnings.length > 0
  };

  return {
    ...reportWithoutMarkdown,
    markdown: renderValidationMarkdown(reportWithoutMarkdown)
  };
}
