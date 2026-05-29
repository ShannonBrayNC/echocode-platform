# Live PR and Write Automation Runbook

EchoCodex supports live GitHub automation only behind explicit policy gates. The default platform remains dry-run first.

## Safety model

Live automation is separated into three layers:

1. Policy decision from `evaluatePolicyGate()`.
2. Live automation request describing branch, file writes, and optional draft PR.
3. GitHub automation client that performs branch creation, file upserts, and PR creation.

If the policy decision is not `allow`, live automation refuses to run before creating a branch or writing any files.

## Supported live operations

| Operation | Required mode | Notes |
| --- | --- | --- |
| Create branch | `createBranch` or `openPullRequest` | Branch is created from the requested base branch. |
| Write files | `writeWorkspace` or `openPullRequest` | File writes occur on the working branch, not directly on `main`. |
| Open pull request | `openPullRequest` | PRs should be opened as draft by default. |
| Auto-merge | `autoMerge` | Still disabled unless policy allows it and validation passes. |

## Required environment

Live automation requires a GitHub token with only the permissions needed for the target repository:

- contents write
- pull requests write

Use `GITHUB_TOKEN` in GitHub Actions when possible. Use `GH_PAT` only for local operator testing when the built-in token cannot perform the action.

## Dry-run verification for Christina

Christina can call `sendChristinaDryRun()` and receive a contract-shaped response:

- `ok`
- `mode`
- `requestedCapability`
- `reportPath`
- `selectedIssue`
- `validationStatus`
- `policyDecision`
- `nextAction`
- `safety`

`isValidChristinaDryRunResponse()` validates the response before Christina routes or escalates it.

## EchoAlpha requirements call

Christina can execute an EchoAlpha requirements call through `executeEchoAlphaRequirementsDryRun()`.

The call models EchoAlpha as a research and intelligence capability, not an autonomous trading system. It covers:

- crypto and market intelligence signal collection
- global emergency-condition and crypto market correlation research
- paper-only backtesting
- human-review risk alerting

The EchoAlpha path is guarded by these rules:

- research and analytics only
- no live trade execution
- no profit guarantees or market timing certainty claims
- human review required before action
- future live trading would require a separate policy gate, paper-trading phase, and explicit human approval

## Live verification performed by this branch

This branch proves the live path by creating a real draft pull request from a working branch back to `main`. The PR is the verification artifact. It should not be auto-merged.

## Validation commands

```bash
npm install
npm run build
npm test
npm run typecheck
npm run echocodex:run
```

## Future hardening

Before enabling unattended live work, add these controls:

- real validation execution instead of preview-only validation
- signed ETS trust verification
- SignalForge event publishing to the real router
- branch protection checks
- required human approval records
- merge queue or protected auto-merge policy
