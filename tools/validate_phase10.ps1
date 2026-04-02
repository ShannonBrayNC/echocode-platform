param(
    [string]$RepoPath = "C:\GitHub\echocode-platform"
)

Set-Location $RepoPath

Write-Host "Cleaning generated artifacts..."
Remove-Item .\tests\generated\* -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\src\echocode\generated\* -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\artifacts\evidence\* -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Running pipeline..."
python -m echocode.main run-pipeline

Write-Host ""
Write-Host "Validation target:"
Write-Host " - Existing work-item PRs should be updated when rerun"
Write-Host " - New work items should still create PRs"
