import { planSprint } from "../christina/planSprint.js";
import { selectNextIssue } from "../christina/selectNextIssue.js";
import type { EchoCodexRunnerConfig, RunnerIssue } from "../github/types.js";
import { createEchoCodexEvent } from "../integrations/events/EchoCodexEvent.js";
import { NoopETSVerifier } from "../integrations/ets/ETSVerifier.js";
import { NoopSignalForgeAdapter } from "../integrations/signalforge/SignalForgeAdapter.js";
import { defaultEchoCodexPolicy, type EchoCodexMode, type EchoCodexPolicy } from "../policy/EchoCodexPolicy.js";
import { evaluatePolicyGate } from "../policy/evaluatePolicyGate.js";
import { scanRepository } from "../repo/RepoScanner.js";
import type { RepoScannerInput } from "../repo/RepoInventory.js";
import { createEchoCodexRunReport } from "../reporting/EchoCodexRunReport.js";
import { buildRunArtifacts } from "../reporting/writeRunArtifacts.js";
import { createPreviewValidationReport } from "../validation/ValidationReport.js";
import { resolveValidationCommands } from "../validation/ValidationCommandResolver.js";

export type EchoCodexSprintRunnerInput = {
  runnerConfig: EchoCodexRunnerConfig;
  policy?: EchoCodexPolicy;
  issues: RunnerIssue[];
  repoContext: RepoScannerInput;
  repo?: string;
  issueNumber?: number;
  maxItems?: number;
  mode?: EchoCodexMode;
  reportDir?: string;
  actor?: string;
  timestamp?: string;
};

export type EchoCodexSprintRunnerResult = {
  mode: EchoCodexMode;
  maxItems: number;
  reportPath: string;
  selectedIssue?: Pick<RunnerIssue, "repo" | "number" | "title" | "url">;
  policyDecision: ReturnType<typeof evaluatePolicyGate>;
  validationStatus: "not-run" | "preview" | "passed" | "failed" | "blocked";
  nextAction: string;
  artifacts: ReturnType<typeof buildRunArtifacts>["artifacts"];
};

function limitIssues(issues: RunnerIssue[], maxItems: number): RunnerIssue[] {
  return issues.slice(0, Math.max(0, maxItems));
}

export async function runEchoCodexSprint(input: EchoCodexSprintRunnerInput): Promise<EchoCodexSprintRunnerResult> {
  const mode = input.mode ?? "dryRun";
  const maxItems = input.maxItems ?? input.runnerConfig.maxItems ?? 25;
  const policy = input.policy ?? defaultEchoCodexPolicy;
  const timestamp = input.timestamp ?? new Date(0).toISOString();
  const actor = input.actor ?? "echocodex-cli";
  const repo = input.repo ?? input.repoContext.repositoryName;
  const scopedIssues = limitIssues(
    input.repo ? input.issues.filter((issue) => issue.repo === input.repo) : input.issues,
    maxItems
  );

  const selected = selectNextIssue({
    issues: scopedIssues,
    explicitIssue: input.issueNumber ? { repo, number: input.issueNumber } : undefined,
    blockedLabels: input.runnerConfig.blockedLabels
  });

  if (!selected.selectedIssue) {
    throw new Error(`No eligible issue selected: ${selected.blockers.map((blocker) => blocker.message).join("; ")}`);
  }

  const inventory = scanRepository(input.repoContext);
  const plan = planSprint({
    issue: selected.selectedIssue,
    repoInventory: inventory,
    currentBranch: input.repoContext.currentBranch
  });
  const validationResolved = resolveValidationCommands(inventory);
  const validationReport = createPreviewValidationReport({
    repo,
    commands: validationResolved.commands,
    warnings: validationResolved.warnings,
    generatedAt: timestamp
  });
  const policyDecision = evaluatePolicyGate({
    policy,
    requestedMode: mode,
    repo,
    branch: input.repoContext.currentBranch,
    changedPaths: plan.impactedFiles,
    validationPassed: validationReport.blocked === false,
    humanApproval: false
  });

  const verifier = new NoopETSVerifier();
  const trust = await verifier.verify({
    recommendationId: `${repo}#${selected.selectedIssue.number}`,
    requestedMode: mode,
    provenance: {
      sourceSystem: "echocodex",
      sourceActor: actor,
      createdAt: timestamp
    }
  });

  const signalForge = new NoopSignalForgeAdapter();
  await signalForge.route(
    createEchoCodexEvent({
      eventType: policyDecision.decision === "block" ? "PolicyBlocked" : "PlanGenerated",
      repo,
      timestamp,
      provenance: {
        sourceSystem: "echocodex",
        sourceActor: actor,
        createdAt: timestamp
      },
      payload: {
        issueNumber: selected.selectedIssue.number,
        mode,
        policyDecision: policyDecision.decision,
        trustState: trust.trustState
      }
    })
  );

  const validationStatus = validationReport.blocked ? "blocked" : "preview";
  const nextAction = policyDecision.decision === "allow" && validationStatus !== "blocked" ? "ready-for-human-review" : "human-review-required";
  const runReport = createEchoCodexRunReport({
    repo,
    branch: input.repoContext.currentBranch,
    selectedIssue: selected.selectedIssue,
    policyDecision,
    actor,
    timestamp,
    riskLevel: policyDecision.decision === "block" || validationStatus === "blocked" ? "blocked" : "medium",
    validationStatus,
    nextAction,
    planMarkdown: plan.markdown,
    validationReport
  });

  const bundle = buildRunArtifacts(runReport);
  const reportPath = input.reportDir ? `${input.reportDir.replace(/\/$/, "")}/${runReport.runId}` : bundle.runDirectory;

  return {
    mode,
    maxItems,
    reportPath,
    selectedIssue: {
      repo: selected.selectedIssue.repo,
      number: selected.selectedIssue.number,
      title: selected.selectedIssue.title,
      url: selected.selectedIssue.url
    },
    policyDecision,
    validationStatus,
    nextAction,
    artifacts: bundle.artifacts
  };
}
