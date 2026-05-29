# EchoCodex Platform

Internal Codex-style engineering agent platform for the Lantern Protocol stack.

EchoCodex repurposes the original EchoCode concept into a repo-aware engineering executor that works with Christina, SignalForge, and ETS. It is designed to inspect repository context, select safe issues, plan implementation work, propose patches, run validation, and produce auditable reports.

## Implemented foundation

### Issue #37: Repo Context Gate

The gate prevents EchoCodex from planning or generating code until it has enough repository context:

- repository name
- file tree
- issue objective

It also warns when optional but important execution metadata is missing:

- current branch
- package/build metadata
- test commands
- build commands

### Issue #38: Repository Scanner

The scanner converts a file tree into a structured repository inventory for Christina and EchoCodex planning.

It detects project types, package manager hints, manifests, docs, CI workflows, build/test hints, and sensitive paths.

### Issue #39: GitHub Issue Ingestion

The GitHub ingestion layer reads configured repositories, excludes pull requests, filters blocked labels, maps issues into `RunnerIssue` objects, and sorts work by repository priority, label priority, and update time.

GitHub auth uses `GITHUB_TOKEN` first and falls back to `GH_PAT`.

### Issue #40: Christina Sprint Planner

The Christina planner selects the next eligible issue, supports explicit issue overrides, detects blocked work, and creates deterministic dry-run sprint plans.

Sprint plans include:

- objective
- selected issue
- impacted files
- ordered tasks
- blockers
- risk notes
- validation commands
- rollback plan
- Markdown summary

### Issue #41: Patch Safety Model

The patch safety model defines proposed file changes before any live write capability exists.

It supports create, update, delete, rename, and no-op changes. It requires issue reference, rationale, validation commands, rollback notes, and per-file rationale.

Protected paths are blocked by default:

- secrets, credentials, tokens, certificates, and private keys
- package lockfiles unless explicitly allowed
- `.github/workflows` unless explicitly allowed
- branch protection, CODEOWNERS, repository rules, and repository settings

Auto approval is available only as `safeOnly`. This approves clean patches with no warnings and no blockers. Any warning, protected file, missing metadata, or unsafe path forces human review or blocks the patch.

### Issue #42: Validation Harness

The validation harness resolves build, test, lint, and typecheck commands from repository inventory and produces preview-mode validation reports.

It supports Node, TypeScript, Python, PowerShell, and mixed repositories. Reports include JSON-ready command results, warnings, blocked state, and Markdown summaries.

The harness is preview-first. It does not execute shell commands yet. Missing validation commands produce warnings and block Christina from marking a sprint complete.

### Issue #43: Policy Gates

The policy gate decides whether EchoCodex may proceed in `dryRun`, `writeWorkspace`, `createBranch`, `openPullRequest`, or `autoMerge` mode.

The default policy allows `dryRun` only. Any mode beyond dry-run requires explicit policy permission and human approval unless a repo override says otherwise.

Policy gates block:

- unsupported modes
- protected branch writes
- denied paths such as secrets, certificates, workflows, lockfiles, and CODEOWNERS
- changed paths outside the allow-list
- auto-merge unless validation passes and policy allows auto-merge

This issue adds the gate only. It does not implement live writes, branch creation, PR creation, or merging.

### Issue #44: Run Reports and Evidence Artifacts

The reporting layer creates auditable EchoCodex run artifacts for Christina and human review.

Reports are modeled under `reports/echocodex/runs/<run-id>/` and can include:

- `run.json`
- `plan.md`
- `patch-preview.diff`
- `validation.json`
- `validation.md`
- `summary.md`
- `index-entry.json`

Run reports include repo, branch, selected issue, policy mode, policy decision, actor, timestamp, risk level, validation status, next action, and deterministic run IDs.

Sensitive values such as token, secret, password, API key, private key, connection string, bearer token, and GitHub token patterns are redacted from generated artifacts while traceability IDs remain intact.

## Development commands

```bash
npm install
npm run build
npm test
npm run typecheck
```

## Safety posture

EchoCodex starts in dry-run mode. Live writes, branch creation, pull requests, and auto-merge must remain blocked until policy gates are explicitly configured and approved.

## Planned pipeline

1. Repo context gate
2. Repository scanner
3. GitHub issue ingestion
4. Christina sprint planner
5. Patch safety model
6. Validation harness
7. Policy gates
8. Run reports and audit artifacts
9. SignalForge routing and ETS trust verification
10. Internal CLI runner
