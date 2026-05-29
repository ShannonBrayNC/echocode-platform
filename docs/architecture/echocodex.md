# EchoCodex Architecture

EchoCodex is the internal Codex-style engineering executor for the Lantern Protocol stack. It repurposes the original EchoCode platform into a repo-aware agent layer that can inspect context, select work, plan safe implementation steps, generate proposed changes, validate them, and emit evidence artifacts.

## Product roles

| Product | Role |
| --- | --- |
| Christina | Scheduler and planner. Chooses eligible work, asks EchoCodex for dry-run plans, and decides whether the next sprint can begin. |
| EchoCodex | Engineering executor. Converts repo context plus issue intent into safe plans, validation previews, policy decisions, and auditable run reports. |
| SignalForge | Router. Receives EchoCodex events and can later route them across the Lantern stack. |
| ETS | Trust verifier. Verifies provenance before external recommendations or generated work can influence write, branch, PR, or merge actions. |

## Module map

| Module | Purpose |
| --- | --- |
| `src/context` | Repo context gate. Prevents planning when required repository facts are missing. |
| `src/repo` | Repository scanner. Converts file trees into inventory: project types, manifests, CI workflows, docs, and sensitive paths. |
| `src/github` | GitHub issue ingestion and `RunnerIssue` mapping. Excludes pull requests and blocked labels. |
| `src/christina` | Sprint selection and planning. Produces dry-run task lists, impacted files, risk notes, validation commands, rollback notes, and Markdown plans. |
| `src/patch` | Patch safety model. Defines proposed file changes and blocks unsafe paths before live write capability exists. |
| `src/validation` | Validation command resolver and preview reports. Resolves build, test, lint, and typecheck commands. |
| `src/policy` | Execution policy gates. Controls `dryRun`, `writeWorkspace`, `createBranch`, `openPullRequest`, and `autoMerge`. |
| `src/reporting` | Run reports and evidence artifacts. Builds `run.json`, Markdown summaries, validation reports, diffs, and index entries. |
| `src/integrations` | SignalForge event hooks and ETS verification stubs. No real external services are called yet. |
| `src/runner` | End-to-end dry-run sprint runner. Wires selection, planning, policy, validation, reporting, and integration hooks. |
| `src/cli` | Operator-facing command-line entrypoint. |

## Dry-run data flow

1. Operator or scheduled job starts EchoCodex in `dryRun` mode.
2. Runner reads `config/echocodex.runner.json` and `config/echocodex.policy.json`.
3. GitHub issue data is mapped into `RunnerIssue` objects.
4. Repository context is scanned into a `RepoInventory`.
5. Christina selection chooses the next eligible issue.
6. Christina planning creates a dry-run sprint plan.
7. Validation resolver creates preview validation commands.
8. Policy gate evaluates the requested mode and changed-path scope.
9. ETS verifier evaluates local provenance shape.
10. SignalForge adapter receives a no-op event route.
11. Reporting layer creates auditable artifact contents under the modeled path `reports/echocodex/runs/<run-id>/`.
12. CLI prints machine-readable JSON for automation and operator review.

## Trust and provenance model

Cross-system recommendations must carry provenance metadata:

- `sourceSystem`
- `sourceActor`
- `createdAt`
- optional `sourceRunId`
- optional `sourceIssue`
- optional `signature`

The current ETS verifier is a no-op local implementation. It does not call the real ETS service. It intentionally treats unsigned recommendations for write, branch, PR, or merge modes as `RequiresHumanReview` and sets `canTriggerWriteOrPr` to `false`.

## Event model

EchoCodex event types are:

- `IssueSelected`
- `PlanGenerated`
- `PatchProposed`
- `ValidationCompleted`
- `PolicyBlocked`
- `HumanApprovalRequired`
- `RunCompleted`

The no-op SignalForge adapter returns route metadata and does not call external services.

## Stack examples

| Repository / product | Example use |
| --- | --- |
| OpsHelm | Dry-run issue selection for ticket ingestion, analyzer hardening, and customer-facing report work. |
| SignalForge | Routing layer validation and cross-product event contract testing. |
| Lantern-Civic | Civic resilience feature planning with ETS-verified provenance and human-review gates. |
| EchoMedia Content Engine | Content workflow issue planning without direct publishing or live asset mutation. |
| Casakey / EchoLiving migration context | External-facing naming and documentation cleanup while preserving internal migration history. |

## Safety boundary

EchoCodex currently operates as a dry-run engineering planner. Live writes, branch creation, PR creation, and auto-merge remain disabled unless policy gates explicitly allow them and future implementations wire the actions behind those gates.
