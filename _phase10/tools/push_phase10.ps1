param(
    [string]$RepoPath = "C:\GitHub\echocode-platform",
    [string]$BranchName = "phase10-idempotency"
)

Set-Location $RepoPath

git checkout -b $BranchName 2>$null

git add src/echocode/services/pr_tracking_service.py
git add src/echocode/services/github_publish_service.py
git add tools/extract_phase10.ps1
git add tools/validate_phase10.ps1
git add tools/push_phase10.ps1

git commit -m "Phase 10: idempotent PR and branch reuse"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Commit failed. Resolve errors above before pushing."
    exit 1
}

git push origin $BranchName
if ($LASTEXITCODE -ne 0) {
    Write-Error "Push failed. Resolve the git error above before creating a PR."
    exit 1
}

Write-Host "Phase 10 pushed successfully."
