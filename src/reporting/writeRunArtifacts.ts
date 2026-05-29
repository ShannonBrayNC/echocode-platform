import type { EchoCodexRunReport } from "./EchoCodexRunReport.js";
import { redactSensitiveValues } from "./redactSensitiveValues.js";

export type RunArtifact = {
  path: string;
  content: string;
};

export type RunArtifactIndexEntry = {
  runId: string;
  repo: string;
  issueNumber: number;
  timestamp: string;
  riskLevel: EchoCodexRunReport["riskLevel"];
  validationStatus: EchoCodexRunReport["validationStatus"];
  nextAction: string;
  reportPath: string;
};

export type RunArtifactBundle = {
  runDirectory: string;
  artifacts: RunArtifact[];
  indexEntry: RunArtifactIndexEntry;
};

function reportRoot(runId: string): string {
  return `reports/echocodex/runs/${runId}`;
}

function artifactPath(runId: string, fileName: string): string {
  return `${reportRoot(runId)}/${fileName}`;
}

function json(value: unknown): string {
  return `${JSON.stringify(redactSensitiveValues(value), null, 2)}\n`;
}

function text(value: string | undefined, fallback: string): string {
  return redactSensitiveValues(value ?? fallback);
}

export function buildRunArtifacts(report: EchoCodexRunReport): RunArtifactBundle {
  const sanitizedReport = redactSensitiveValues(report);
  const artifacts: RunArtifact[] = [
    {
      path: artifactPath(report.runId, "run.json"),
      content: json(sanitizedReport)
    },
    {
      path: artifactPath(report.runId, "summary.md"),
      content: text(report.summaryMarkdown, "# EchoCodex Run Summary\n\nNo summary was provided.\n")
    }
  ];

  if (report.planMarkdown) {
    artifacts.push({
      path: artifactPath(report.runId, "plan.md"),
      content: text(report.planMarkdown, "# Plan\n\nNo plan was provided.\n")
    });
  }

  if (report.patchPreviewDiff) {
    artifacts.push({
      path: artifactPath(report.runId, "patch-preview.diff"),
      content: text(report.patchPreviewDiff, "")
    });
  }

  if (report.validationReport) {
    artifacts.push(
      {
        path: artifactPath(report.runId, "validation.json"),
        content: json(report.validationReport)
      },
      {
        path: artifactPath(report.runId, "validation.md"),
        content: text(report.validationReport.markdown, "# Validation Report\n\nNo validation report was provided.\n")
      }
    );
  }

  const indexEntry: RunArtifactIndexEntry = {
    runId: report.runId,
    repo: report.repo,
    issueNumber: report.selectedIssue.number,
    timestamp: report.timestamp,
    riskLevel: report.riskLevel,
    validationStatus: report.validationStatus,
    nextAction: report.nextAction,
    reportPath: reportRoot(report.runId)
  };

  artifacts.push({
    path: artifactPath(report.runId, "index-entry.json"),
    content: json(indexEntry)
  });

  return {
    runDirectory: reportRoot(report.runId),
    artifacts,
    indexEntry
  };
}
