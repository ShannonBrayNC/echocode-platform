param(
    [string]$SourceZip = "echocode_phase10_pack.zip",
    [string]$TargetPath = "C:\GitHub\echocode-platform"
)

Write-Host "Extracting Phase 10 pack..."
Expand-Archive -Path $SourceZip -DestinationPath "$TargetPath\_phase10" -Force

Write-Host "Copying updated files into repo..."
Copy-Item "$TargetPath\_phase10\src\*" "$TargetPath\src\" -Recurse -Force
Copy-Item "$TargetPath\_phase10\tools\*" "$TargetPath\tools\" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Phase 10 files copied."
Write-Host "Recommended next steps:"
Write-Host "  1. python -m echocode.main run-pipeline"
Write-Host "  2. Verify existing PRs are updated instead of duplicated"
