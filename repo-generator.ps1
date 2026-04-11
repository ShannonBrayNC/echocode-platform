param(
    [string]$SpecPath = ".\repo-spec.json",
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return
    }

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-RepoFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Content,

        [Parameter(Mandatory = $false)]
        [bool]$Overwrite = $false
    )

    $dir = Split-Path -Path $Path -Parent

    if (-not [string]::IsNullOrWhiteSpace($dir)) {
        Ensure-Directory -Path $dir
    }

    if ((Test-Path -LiteralPath $Path) -and (-not $Overwrite)) {
        Write-Host "Skipping existing file: $Path" -ForegroundColor Yellow
        return
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    Write-Host "Wrote file: $Path" -ForegroundColor Green
}

# Resolve the spec path relative to the current location first
$resolvedSpec = Resolve-Path -LiteralPath $SpecPath -ErrorAction Stop
$specFilePath = $resolvedSpec.Path
$specDirectory = Split-Path -Path $specFilePath -Parent

Write-Host "Using spec: $specFilePath" -ForegroundColor Cyan
Write-Host "Using spec directory: $specDirectory" -ForegroundColor Cyan

$raw = Get-Content -LiteralPath $specFilePath -Raw -Encoding UTF8
$spec = $raw | ConvertFrom-Json -Depth 100

# Anchor root to the spec file location, not the shell's random working directory
$rootSetting = if ($null -eq $spec.root) { "." } else { [string]$spec.root }

if ([string]::IsNullOrWhiteSpace($rootSetting) -or $rootSetting -eq ".") {
    $repoRoot = $specDirectory
}
elseif ([System.IO.Path]::IsPathRooted($rootSetting)) {
    $repoRoot = $rootSetting
}
else {
    $repoRoot = Join-Path $specDirectory $rootSetting
}

$repoRoot = [System.IO.Path]::GetFullPath($repoRoot)

Write-Host "Using repo root: $repoRoot" -ForegroundColor Cyan
Ensure-Directory -Path $repoRoot

foreach ($dir in $spec.directories) {
    $targetDir = Join-Path $repoRoot ([string]$dir)
    Ensure-Directory -Path $targetDir
    Write-Host "Ensured dir: $targetDir" -ForegroundColor DarkCyan
}

foreach ($file in $spec.files) {
    $relativePath = [string]$file.path
    $targetFile = Join-Path $repoRoot $relativePath
    $targetFile = [System.IO.Path]::GetFullPath($targetFile)

    # Safety rail: refuse to write outside repo root
    if (-not $targetFile.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to write outside repo root. Target: $targetFile"
    }

    $content = if ($null -eq $file.content) { "" } else { [string]$file.content }
    Write-RepoFile -Path $targetFile -Content $content -Overwrite:$Force.IsPresent
}

Write-Host ""
Write-Host "Repo generation complete." -ForegroundColor Green