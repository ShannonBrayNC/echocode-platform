# EchoCodex Policy Gates

EchoCodex policy gates control what the runner is allowed to do. They are the hard line between safe planning and live repository changes.

## Default posture

The default policy allows `dryRun` only.

Live writes, branch creation, pull requests, and auto-merge are blocked unless policy configuration explicitly allows them and the implementation path is wired behind the policy gate.

## Modes

| Mode | Purpose | Current operator posture |
| --- | --- | --- |
| `dryRun` | Select issues, generate plans, preview validation, evaluate policy, and create report artifacts. | Allowed by default. |
| `writeWorkspace` | Write changes to a working directory. | Blocked by default. Requires explicit policy and future implementation. |
| `createBranch` | Create or update a working branch. | Blocked by default. Requires explicit policy and future implementation. |
| `openPullRequest` | Open a pull request from a prepared branch. | Blocked by default. Requires explicit policy and future implementation. |
| `autoMerge` | Merge after validation and approval. | Blocked by default. Requires explicit policy, passing validation, and future implementation. |

## Protected branches

Protected branch writes are blocked for non-dry-run modes. Default protected branches are:

```text
main
master
production
release
```

## Path rules

Default deny paths include:

```text
.env*
**/*.pem
**/*.pfx
**/*.key
.github/workflows/**
CODEOWNERS
package-lock.json
pnpm-lock.yaml
yarn.lock
```

Default allow paths include:

```text
src/**
tests/**
docs/**
README.md
config/*.json
```

Changed paths outside the allow-list are blocked unless policy is expanded for that repo.

## Human approval

Any mode beyond `dryRun` should require human approval unless a repo-specific policy override explicitly says otherwise.

The gate can return:

| Decision | Meaning |
| --- | --- |
| `allow` | The requested mode passes the policy gate. |
| `requires-human-approval` | The mode is allowed by policy but cannot continue without human approval. |
| `block` | The requested action is not permitted. |

## ETS trust verification

Policy permission is not enough for external recommendations. ETS must verify provenance before external input can influence write, branch, PR, or merge actions.

Trust states are:

| Trust state | Meaning |
| --- | --- |
| `Verified` | Provenance shape is accepted by the current verifier. Future real ETS verification can replace this stub. |
| `Unverified` | Input can be used for dry-run analysis only. |
| `RequiresHumanReview` | Input cannot trigger write or PR actions. A human must inspect it. |
| `Rejected` | Input should be ignored or escalated. |

## SignalForge routing

SignalForge is the router for cross-product events. The current no-op adapter only returns route metadata. It does not call external services.

## Safe policy change checklist

Before expanding policy beyond `dryRun`, confirm:

1. The repo has a documented owner.
2. The target branch is not protected.
3. The path allow-list is narrow.
4. Deny rules still cover secrets, certificates, workflows, lockfiles, and ownership files.
5. Validation commands pass locally and in CI.
6. ETS trust behavior is understood for the source of the recommendation.
7. Report artifacts are reviewed by a human.
8. Rollback instructions exist.

## Never allow yet

Do not enable `autoMerge` until:

- validation is executed, not preview-only
- report artifacts are persisted
- branch protection is configured
- ETS real verification is integrated
- review approval policy is defined
- failure rollback is tested
