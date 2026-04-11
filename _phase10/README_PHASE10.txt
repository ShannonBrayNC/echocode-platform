Phase 10 - Idempotency and Safe Re-Runs

What this pack changes:
- Reuses an existing work-item branch instead of failing on branch creation
- Reuses an existing open PR for the same work item instead of creating duplicates
- Adds a comment when artifacts are refreshed on an existing PR

Files included:
- src/echocode/services/pr_tracking_service.py
- src/echocode/services/github_publish_service.py
- tools/extract_phase10.ps1
- tools/validate_phase10.ps1
- tools/push_phase10.ps1

Suggested workflow:
1. Extract pack into repo root
2. Run: .\tools\extract_phase10.ps1
3. Run: python -m echocode.main run-pipeline
4. Verify existing PRs are updated rather than duplicated
5. Commit and push changes
