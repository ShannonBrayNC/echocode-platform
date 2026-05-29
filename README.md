# EchoCodex Platform

Internal Codex-style engineering agent platform for the Lantern Protocol stack.

EchoCodex repurposes the original EchoCode concept into a repo-aware engineering executor that works with Christina, SignalForge, and ETS. It is designed to inspect repository context, select safe issues, plan implementation work, propose patches, run validation, and produce auditable reports.

## Current sprint

The first implemented capability is the **Repo Context Gate** for issue #37.

The gate prevents EchoCodex from planning or generating code until it has enough repository context:

- repository name
- file tree
- issue objective

It also warns when optional but important execution metadata is missing:

- current branch
- package/build metadata
- test commands
- build commands

## Development commands

```bash
npm install
npm run build
npm test
npm run typecheck
```

## Safety posture

EchoCodex starts in dry-run mode. Live writes, branch creation, pull requests, and auto-merge must remain blocked until policy gates are implemented and explicitly enabled.

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
