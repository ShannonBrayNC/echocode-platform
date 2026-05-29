import type { PolicyGateResult } from "../policy/EchoCodexPolicy.js";
import type { ValidationReport } from "../validation/ValidationReport.js";

export type EchoCodexRiskLevel = "low" | "medium" | "high" | "blocked";

export type EchoCodexRunIssue = {
  repo: string;
  number: number;
  title: string;
  url?: string;
};

export type EchoCodexRunReport = {
  runId: string;
  repo: string;
  branch?: string;
  selectedIssue: EchoCodexRunIssue;
  policyMode: string;
  policyDecision: PolicyGateResult;
  actor: string;
  timestamp: string;
  riskLevel: EchoCodexRiskLevel;
  validationStatus: "not-run" | "preview" | "passed" | "failed" | "blocked";
  nextAction: string;
  planMarkdown?: string;
  patchPreviewDiff?: string;
  validationReport?: ValidationReport;
  summaryMarkdown: string;
};

export type EchoCodexRunReportInput = {
  repo: string;
  branch?: string;
  selectedIssue: EchoCodexRunIssue;
  policyDecision: PolicyGateResult;
  actor: string;
  timestamp: string;
  riskLevel?: EchoCodexRiskLevel;
  validationStatus?: EchoCodexRunReport["validationStatus"];
  nextAction: string;
  planMarkdown?: string;
  patchPreviewDiff?: string;
  validationReport?: ValidationReport;
};

export function createRunId(params: { repo: string; issueNumber: number; timestamp: string }): string {
  const repoSlug = params.repo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const timeSlug = params.timestamp.replace(/[^0-9]/g, "").slice(0, 14);

  return `${timeSlug}-${repoSlug}-${params.issueNumber}`;
}

export function renderRunSummaryMarkdown(report: Omit<EchoCodexRunReport, "summaryMarkdown">): string {
  return [
    "# EchoCodex Run Summary",
    "",
    `- Run ID: ${report.runId}`,
    `- Repo: ${report.repo}`,
    `- Branch: ${report.branch ?? "unknown"}`,
    `- Issue: ${report.selectedIssue.repo}#${report.selectedIssue.number} ${report.selectedIssue.title}`,
    `- Actor: ${report.actor}`,
    `- Timestamp: ${report.timestamp}`,
    `- Policy mode: ${report.policyMode}`,
    `- Policy decision: ${report.policyDecision.decision}`,
    `- Risk level: ${report.riskLevel}`,
    `- Validation status: ${report.validationStatus}`,
    `- Next action: ${report.nextAction}`,
    "",
    "## Policy reasons",
    "",
    report.policyDecision.reasons.length === 0
      ? "- None"
      : report.policyDecision.reasons.map((reason) => `- ${reason.code}: ${reason.message}`).join("\n"),
    ""
  ].join("\n");
}

export function createEchoCodexRunReport(input: EchoCodexRunReportInput): EchoCodexRunReport {
  const runId = createRunId({
    repo: input.repo,
    issueNumber: input.selectedIssue.number,
    timestamp: input.timestamp
  });

  const reportWithoutSummary: Omit<EchoCodexRunReport, "summaryMarkdown"> = {
    runId,
    repo: input.repo,
    branch: input.branch,
    selectedIssue: input.selectedIssue,
    policyMode: input.policyDecision.effectiveMode,
    policyDecision: input.policyDecision,
    actor: input.actor,
    timestamp: input.timestamp,
    riskLevel: input.riskLevel ?? (input.policyDecision.decision === "block" ? "blocked" : "low"),
    validationStatus: input.validationStatus ?? input.validationReport?.mode ?? "not-run",
    nextAction: input.nextAction,
    planMarkdown: input.planMarkdown,
    patchPreviewDiff: input.patchPreviewDiff,
    validationReport: input.validationReport
  };

  return {
    ...reportWithoutSummary,
    summaryMarkdown: renderRunSummaryMarkdown(reportWithoutSummary)
  };
}
