# EchoCodex Troubleshooting

Use this guide when dry-run execution does not produce the expected plan, policy decision, validation preview, or report output.

## GitHub authentication

### Symptom

Issue ingestion cannot reach GitHub or returns no issues when issues are expected.

### Checks

1. Confirm `GITHUB_TOKEN` or `GH_PAT` is available in the shell or workflow.
2. Confirm the token can read the target repository.
3. Confirm the target repo appears in `config/echocodex.runner.json`.
4. Confirm pull requests are not being counted as issues. EchoCodex excludes PR-shaped issue records.

### Current CLI note

The first dry-run CLI path uses mocked issue and repo context. It does not require a GitHub token unless future issue ingestion is enabled in the runner.

## Missing repo context

### Symptom

The repo context gate blocks planning or the scanner returns `unknown` project type.

### Checks

1. Confirm repository name is present in `owner/name` format.
2. Confirm a file tree is supplied as `fileTree`.
3. Confirm the file tree includes manifests such as `package.json`, `tsconfig.json`, `pyproject.toml`, or PowerShell test files where applicable.
4. Confirm issue objective is included when using the context gate directly.

## Validation failures or blocked validation previews

### Symptom

Validation status is `blocked`, or Christina refuses to mark the sprint complete.

### Checks

1. Confirm build and test commands are discoverable.
2. For Node and TypeScript repos, confirm `package.json` and `tsconfig.json` are in the file tree.
3. For Python repos, confirm `pyproject.toml`, `requirements.txt`, or test files are present.
4. For PowerShell repos, confirm Pester test files are present.
5. Run local validation commands:

```bash
npm install
npm run build
npm test
npm run typecheck
```

### Important note

The validation harness is preview-first today. It resolves commands and creates reports but does not execute shell commands yet.

## Blocked policy gates

### Symptom

Policy decision is `block` or `requires-human-approval`.

### Checks

1. Confirm requested mode is `dryRun`.
2. Confirm changed paths are inside allowed path rules.
3. Confirm changed paths do not include denied paths such as secrets, certificates, workflows, lockfiles, or CODEOWNERS.
4. Confirm non-dry-run modes are not being requested accidentally.
5. Review `config/echocodex.policy.json`.

### Common causes

| Cause | Resolution |
| --- | --- |
| `mode-not-allowed` | Use `dryRun`, or update policy only after human review. |
| `protected-branch` | Do not write directly to protected branches. |
| `path-denied` | Remove sensitive or protected paths from the proposed change. |
| `path-not-allowed` | Narrow the change or update repo-specific policy after review. |
| `auto-merge-not-allowed` | Keep auto-merge disabled. |

## ETS trust states

### Symptom

External recommendation cannot trigger write or PR actions.

### Checks

1. Confirm provenance includes `sourceSystem`, `sourceActor`, and `createdAt`.
2. Confirm any write, branch, PR, or merge recommendation has verified provenance.
3. Treat `Unverified` and `RequiresHumanReview` as review-only signals.

## Report output missing

### Symptom

CLI prints a report path but files are not on disk.

### Explanation

The current reporting layer builds artifact contents and modeled paths. The current runner does not write those artifacts to disk automatically. Future work can persist artifacts after the filesystem strategy is finalized.

## Stack-specific notes

| Stack item | Troubleshooting hint |
| --- | --- |
| OpsHelm | Confirm analyzer, ingestion, and test paths are represented in the file tree before planning. |
| SignalForge | Confirm routing events are no-op unless real adapters are explicitly configured later. |
| Lantern-Civic | Keep civic resilience and adversarial-detection work human-review oriented. |
| EchoMedia Content Engine | Treat publishing or content distribution as out of scope for dry-run engineering plans. |
| Casakey / EchoLiving migration | Use Casakey LLC externally while preserving EchoLiving as internal migration context. |

## Escalation rule

When in doubt, stop at dry-run output and request human review. EchoCodex should never proceed to live repository changes without explicit policy approval, verified provenance, and reviewed evidence artifacts.
