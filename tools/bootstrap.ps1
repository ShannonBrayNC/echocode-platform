param()

Write-Host "Bootstrapping EchoCode Platform..." -ForegroundColor Cyan

if (-not (Test-Path ".\.venv")) {
    python -m venv .venv
}

& ".\.venv\Scripts\Activate.ps1"

python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -e .[dev]

Write-Host "Bootstrap complete." -ForegroundColor Green