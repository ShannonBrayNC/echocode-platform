# Runbook: Execute an EchoCodex Dry-Run Sprint

This runbook explains how to run EchoCodex safely in dry-run mode. It is written for an operator who has not worked in this repo before.

## Safety statement

EchoCodex dry-run mode does not create branches, write files, open pull requests, or merge code. It generates plans, validation previews, policy decisions, and report artifacts for human review.

## Prerequisites

- Node.js 22 or later is recommended.
- Repository cloned locally.
- PowerShell 7+ or a POSIX shell.
- GitHub token is optional for the current mocked dry-run CLI path. It will be required later for live issue ingestion.

## Install dependencies

```bash
npm install
```

## Validate the project

```bash
npm run build
npm test
npm run typecheck
```

The test command currently uses Node's test runner with `tsx`.

## Run the dry-run CLI

```bash
npm run echocodex:run
```

Equivalent direct command:

```bash
npx tsx src/cli/echocodex.ts --mode dryRun --json --mock
```

## Optional flags

```bash
npx tsx src/cli/echocodex.ts `
  --repo ShannonBrayNC/echocode-platform `
  --issue 46 `
  --maxItems 5 `
  --mode dryRun `
  --reportDir reports/echocodex/runs `
  --json `
  --mock
```

Supported flags:

| Flag | Purpose |
| --- | --- |
| `--repo` | Target repository name in `owner/name` format. |
| `--issue` | Explicit issue number to select. |
| `--maxItems` | Maximum number of issue candidates. |
| `--mode dryRun` | Execution mode. Only `dryRun` should be used by operators today. |
| `--reportDir` | Optional report output root path for the modeled report path. |
| `--json` | Pretty-print machine-readable JSON. |
| `--mock` | Use mocked issue/repo context for the first dry-run workflow. |

## Expected JSON output

The CLI prints JSON with this shape:

```json
{
  "mode": "dryRun",
  "maxItems": 25,
  "reportPath": "reports/echocodex/runs/<run-id>",
  "selectedIssue": {
    "repo": "ShannonBrayNC/echocode-platform",
    "number": 46,
    "title": "Create internal CLI runner for dry-run sprint execution",
    "url": "https://github.com/ShannonBrayNC/echocode-platform/issues/46"
  },
  "policyDecision": {
    "decision": "allow",
    "effectiveMode": "dryRun"
  },
  "validationStatus": "preview",
  "nextAction": "ready-for-human-review"
}
```

## Expected report artifacts

The report generator models artifacts under:

```text
reports/echocodex/runs/<run-id>/
```

Possible files:

```text
run.json
plan.md
patch-preview.diff
validation.json
validation.md
summary.md
index-entry.json
```

The current runner builds artifact contents in memory. Future runner work can write those artifacts to disk after the policy and filesystem strategy are finalized.

## When to stop and request review

Stop and request human review when:

- policy decision is `block`
- policy decision is `requires-human-approval`
- validation status is `blocked`
- selected issue is missing
- report output contains unexpected impacted files
- ETS trust state is not `Verified` for any recommendation that would affect write, branch, PR, or merge actions

## Stack examples

Use `--repo` to scope future dry-run work:

```bash
npx tsx src/cli/echocodex.ts --repo ShannonBrayNC/OpsHelm --mode dryRun --json --mock
npx tsx src/cli/echocodex.ts --repo ShannonBrayNC/SignalForge --mode dryRun --json --mock
npx tsx src/cli/echocodex.ts --repo ShannonBrayNC/Lantern-Civic --mode dryRun --json --mock
```

For EchoMedia Content Engine and Casakey/EchoLiving migration documentation, use the repo name that owns the work item and keep external-facing language aligned with Casakey LLC where applicable.
