# Christina Repo Review Profile

## Scope

EchoCode Platform is onboarded as a Christina scheduled review target for multi-agent SDLC health, sprint recommendations, and duplicate-safe issue creation.

The repo is already present in Christina's `christina.review.json` target list as:

```json
{
  "fullName": "ShannonBrayNC/echocode-platform",
  "defaultBranch": "main"
}
```

Repo-local metadata lives in `.christina/repo-profile.json`.

## Automation-safe commands

Primary scheduled-review commands:

```text
python -m pytest tests/unit -q
python tools/ci_validate.py
```

Optional local commands when dev dependencies are installed:

```text
ruff check .
mypy src
```

`tools/validate.ps1` also captures the local full validation intent, but scheduled Christina review should prefer the explicit no-write commands above.

## Review priorities

- Multi-agent workflow health.
- PM/Architect/Coder/QA handoff readiness.
- Traceability and evidence completeness.
- Generated work-item test harness quality.
- Type checking and lint readiness.
- Cross-repo integration with OpsHelm, Christina, SignalForge, and ETS.

## Duplicate-safe issue fingerprints

Christina-created issues should include a fingerprint derived from:

```text
repo + category + affectedPath + recommendationSlug
```

Profile format:

```text
christina:echocode-platform:{category}:{affectedPath}:{recommendationSlug}
```

If an open issue with the same fingerprint exists, Christina should update that issue instead of creating a duplicate.

## Safe automation boundaries

Christina may recommend work freely, but auto-fix mode is disabled by default. Future auto-fix execution must be human-approved and limited to issues carrying `needs-codex`.

Allowed auto-fix scopes:

- documentation,
- tests,
- non-production scaffolding.

Blocked scopes:

- repo settings,
- secrets,
- release automation,
- generated work-item branches,
- GitHub publishing,
- external model calls.

## Labels

Suggested labels:

- `christina`
- `repo-review`
- `echocode`
- `automation`
- `needs-codex`
