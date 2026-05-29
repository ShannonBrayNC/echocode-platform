#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runEchoCodexSprint } from "../runner/runEchoCodexSprint.js";
import type { EchoCodexRunnerConfig, RunnerIssue } from "../github/types.js";
import type { EchoCodexMode, EchoCodexPolicy } from "../policy/EchoCodexPolicy.js";
import type { RepoScannerInput } from "../repo/RepoInventory.js";

export type EchoCodexCliArgs = {
  repo?: string;
  issue?: number;
  maxItems?: number;
  mode?: EchoCodexMode;
  reportDir?: string;
  json?: boolean;
  mock?: boolean;
};

function parseArgs(argv: string[]): EchoCodexCliArgs {
  const args: EchoCodexCliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--mock") {
      args.mock = true;
    } else if (arg === "--repo" && next) {
      args.repo = next;
      index += 1;
    } else if (arg === "--issue" && next) {
      args.issue = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === "--maxItems" && next) {
      args.maxItems = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === "--mode" && next) {
      args.mode = next as EchoCodexMode;
      index += 1;
    } else if (arg === "--reportDir" && next) {
      args.reportDir = next;
      index += 1;
    }
  }

  return args;
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function createMockIssues(repo: string, issueNumber?: number): RunnerIssue[] {
  const number = issueNumber ?? 46;
  const isOpsHelmGraphIssue = repo === "ShannonBrayNC/OpsHelm" && number === 47;

  return [
    {
      repo,
      number,
      title: isOpsHelmGraphIssue
        ? "Phase 2: Implement Graph live delta ingestion and ticket container writer"
        : "Create internal CLI runner for dry-run sprint execution",
      body: isOpsHelmGraphIssue
        ? [
            "Implement the live Microsoft Graph ingestion layer that converts mailbox messages into deterministic OpsHelm ticket containers.",
            "",
            "Scope:",
            "- Add incremental polling with delta/checkpoint support.",
            "- Add ticket container writer.",
            "- Persist checkpoint state.",
            "- Preserve deterministic replay mode.",
            "- Keep mailbox access read-only.",
            "- Emit governance/audit metadata.",
            "",
            "Acceptance Criteria:",
            "- Can run in deterministic replay mode without Graph credentials.",
            "- Can poll mailbox messages when Graph credentials are configured.",
            "- Groups normalized messages by ticket ID.",
            "- Emits Ticket-* containers compatible with existing tools.",
            "- Does not send email.",
            "- Does not mutate mailbox state.",
            "- Preserves checkpoint metadata for resumable ingestion."
          ].join("\n")
        : "Mocked issue for local dry-run CLI validation.",
      labels: isOpsHelmGraphIssue ? ["opshelm", "ai-analysis", "priority:high"] : ["echocodex", "christina-ready"],
      priority: isOpsHelmGraphIssue ? 125 : 100,
      updatedAt: "2026-05-29T06:00:00Z",
      url: `https://github.com/${repo}/issues/${number}`,
      sourceSystem: "github"
    }
  ];
}

function createMockRepoContext(repo: string): RepoScannerInput {
  if (repo === "ShannonBrayNC/OpsHelm") {
    return {
      repositoryName: repo,
      fileTree: [
        "package.json",
        "services/ingestion/runTicketAnalysis.ts",
        "services/ingestion/tests/runTicketAnalysis.test.ts",
        "services/ingestion/tests/graphIngestion.test.ts",
        "services/ingestion/connectors/graphDeltaClient.ts",
        "services/ingestion/writers/ticketContainerWriter.ts",
        "services/ingestion/checkpoints/checkpointStore.ts"
      ]
    };
  }

  return {
    repositoryName: repo,
    fileTree: [
      "package.json",
      "tsconfig.json",
      "src/cli/echocodex.ts",
      "src/runner/runEchoCodexSprint.ts",
      "tests/cli/echocodex.test.ts"
    ]
  };
}

function writeArtifacts(artifacts: Array<{ path: string; content: string }>): void {
  for (const artifact of artifacts) {
    mkdirSync(dirname(artifact.path), { recursive: true });
    writeFileSync(artifact.path, artifact.content, "utf8");
  }
}

export async function runCli(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const runnerConfig = readJsonFile<EchoCodexRunnerConfig>("config/echocodex.runner.json");
  const policy = readJsonFile<EchoCodexPolicy>("config/echocodex.policy.json");
  const repo = args.repo ?? runnerConfig.repoPriority[0]?.repo;

  if (!repo) {
    throw new Error("No repository was provided and config/echocodex.runner.json has no repoPriority entries.");
  }

  if (args.mode && args.mode !== "dryRun") {
    const allowed = policy.allowedModes.includes(args.mode);
    if (!allowed) {
      const output = {
        mode: args.mode,
        maxItems: args.maxItems ?? runnerConfig.maxItems ?? 25,
        reportPath: null,
        selectedIssue: null,
        policyDecision: {
          decision: "block",
          effectiveMode: args.mode,
          repo,
          reasons: [{ code: "mode-not-allowed", message: `${args.mode} is not allowed by policy.` }],
          humanApprovalRequired: true
        },
        validationStatus: "not-run",
        nextAction: "human-review-required"
      };

      process.stdout.write(`${JSON.stringify(output, null, args.json ? 2 : 0)}\n`);
      return 2;
    }
  }

  const result = await runEchoCodexSprint({
    runnerConfig,
    policy,
    repo,
    currentBranch: "main",
    issueNumber: args.issue,
    maxItems: args.maxItems,
    mode: args.mode ?? "dryRun",
    reportDir: args.reportDir,
    issues: createMockIssues(repo, args.issue),
    repoContext: createMockRepoContext(repo),
    actor: "echocodex-cli",
    timestamp: "2026-05-29T06:00:00Z"
  });

  writeArtifacts(result.artifacts);

  const output = {
    mode: result.mode,
    maxItems: result.maxItems,
    reportPath: result.reportPath,
    selectedIssue: result.selectedIssue,
    policyDecision: result.policyDecision,
    validationStatus: result.validationStatus,
    nextAction: result.nextAction
  };

  process.stdout.write(`${JSON.stringify(output, null, args.json ? 2 : 0)}\n`);
  return result.policyDecision.decision === "block" ? 2 : 0;
}

function isCliEntrypoint(): boolean {
  const invokedPath = process.argv[1];

  if (!invokedPath) {
    return false;
  }

  return import.meta.url === pathToFileURL(resolve(invokedPath)).href;
}

if (isCliEntrypoint()) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
