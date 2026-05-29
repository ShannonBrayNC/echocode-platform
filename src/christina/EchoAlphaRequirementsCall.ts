import { defaultEchoCodexPolicy } from "../policy/EchoCodexPolicy.js";
import type { EchoCodexRunnerConfig, RunnerIssue } from "../github/types.js";
import { sendChristinaDryRun, type ChristinaDryRunResponse } from "./ChristinaEchoCodexClient.js";

export type EchoAlphaRequirementDomain =
  | "market-intelligence"
  | "crypto-research"
  | "sentiment-analysis"
  | "backtesting"
  | "portfolio-monitoring"
  | "risk-alerting"
  | "financial-correlation-research";

export type EchoAlphaRequirement = {
  id: string;
  domain: EchoAlphaRequirementDomain;
  title: string;
  description: string;
  acceptanceCriteria: string[];
};

export type EchoAlphaRequirementsCall = {
  capability: "echoalpha.requirements";
  repo: "ShannonBrayNC/echocode-platform";
  requestedBy: "christina";
  dryRunOnly: true;
  requirements: EchoAlphaRequirement[];
  guardrails: string[];
  repoContextFileTree: string[];
};

export type EchoAlphaRequirementsDryRunResult = ChristinaDryRunResponse & {
  capability: "echoalpha.requirements";
  requirementsCount: number;
  guardrails: string[];
};

export const echoAlphaGuardrails = [
  "Research and analytics only. Do not execute trades.",
  "No profit guarantees, return promises, or market timing certainty claims.",
  "All financial outputs must be labeled as informational and require human review.",
  "Any future live trading connector must require a separate policy gate, paper-trading phase, and explicit human approval.",
  "Market, emergency-condition, and crypto-correlation signals must distinguish observed facts, inferred signals, forecasts, and unverified reports."
] as const;

export function buildEchoAlphaRequirementsCall(): EchoAlphaRequirementsCall {
  return {
    capability: "echoalpha.requirements",
    repo: "ShannonBrayNC/echocode-platform",
    requestedBy: "christina",
    dryRunOnly: true,
    guardrails: [...echoAlphaGuardrails],
    repoContextFileTree: [
      "package.json",
      "tsconfig.json",
      "src/christina/ChristinaEchoCodexClient.ts",
      "src/christina/EchoAlphaRequirementsCall.ts",
      "src/runner/runEchoCodexSprint.ts",
      "src/policy/EchoCodexPolicy.ts",
      "docs/runbooks/live-pr-write-automation.md",
      "tests/christina/ChristinaEchoCodexClient.test.ts"
    ],
    requirements: [
      {
        id: "EA-REQ-001",
        domain: "market-intelligence",
        title: "Collect crypto and market intelligence signals",
        description: "Define the ingestion contract for crypto market data, macro indicators, and relevant public market context used by EchoAlpha research workflows.",
        acceptanceCriteria: [
          "Sources are labeled by type and freshness.",
          "Data lineage is preserved for audit review.",
          "Unverified sources are not promoted to verified signals without review."
        ]
      },
      {
        id: "EA-REQ-002",
        domain: "financial-correlation-research",
        title: "Correlate global emergency-condition signals with crypto market behavior",
        description: "Define research requirements for comparing ETS/SignalForge emergency-condition events against historical and real-time crypto market moves.",
        acceptanceCriteria: [
          "Signals are classified as observed, inferred, forecast, or unverified.",
          "Correlation outputs are research artifacts, not trading instructions.",
          "Every generated insight includes confidence and evidence references."
        ]
      },
      {
        id: "EA-REQ-003",
        domain: "backtesting",
        title: "Run paper-only strategy backtests",
        description: "Define a backtesting workflow that evaluates hypothetical strategies against historical data without placing trades.",
        acceptanceCriteria: [
          "Backtests run in offline or paper-only mode.",
          "Reports include assumptions, limitations, drawdown, and false-positive risks.",
          "No workflow can submit a live order."
        ]
      },
      {
        id: "EA-REQ-004",
        domain: "risk-alerting",
        title: "Generate human-review risk alerts",
        description: "Define alerting requirements for research signals that may deserve human review, including volatility shifts, liquidity warnings, and civic/emergency-condition correlations.",
        acceptanceCriteria: [
          "Alerts require human review before action.",
          "Alerts include signal category, source, timestamp, confidence, and uncertainty.",
          "Alerts avoid profit or timing certainty language."
        ]
      }
    ]
  };
}

function buildRunnerIssue(call: EchoAlphaRequirementsCall): RunnerIssue {
  return {
    repo: call.repo,
    number: 5701,
    title: "Define EchoAlpha crypto intelligence and financial correlation requirements",
    body: [
      "Christina requested an EchoAlpha requirements sprint through EchoCodex.",
      "",
      "Scope:",
      ...call.requirements.map((requirement) => `- ${requirement.id}: ${requirement.title}`),
      "",
      "Guardrails:",
      ...call.guardrails.map((guardrail) => `- ${guardrail}`)
    ].join("\n"),
    labels: ["christina-ready", "echoalpha", "requirements", "dry-run-only"],
    priority: 125,
    updatedAt: "2026-05-29T07:45:00Z",
    url: "https://github.com/ShannonBrayNC/echocode-platform/issues/5701",
    sourceSystem: "christina"
  };
}

function buildRunnerConfig(call: EchoAlphaRequirementsCall): EchoCodexRunnerConfig {
  return {
    repoPriority: [
      {
        repo: call.repo,
        priority: 125,
        labels: ["echoalpha", "requirements"]
      }
    ],
    blockedLabels: ["blocked", "unsafe", "live-trading"],
    priorityLabels: {
      "christina-ready": 25,
      echoalpha: 20,
      requirements: 10
    },
    maxItems: 5
  };
}

export async function executeEchoAlphaRequirementsDryRun(call = buildEchoAlphaRequirementsCall()): Promise<EchoAlphaRequirementsDryRunResult> {
  const response = await sendChristinaDryRun({
    requestedCapability: call.capability,
    runnerConfig: buildRunnerConfig(call),
    policy: defaultEchoCodexPolicy,
    issues: [buildRunnerIssue(call)],
    repo: call.repo,
    repoContext: {
      repositoryName: call.repo,
      fileTree: call.repoContextFileTree
    },
    currentBranch: "main",
    actor: call.requestedBy,
    timestamp: "2026-05-29T07:45:00Z"
  });

  return {
    ...response,
    capability: call.capability,
    requirementsCount: call.requirements.length,
    guardrails: call.guardrails
  };
}
