$ErrorActionPreference = "Stop"
if (-not (Test-Path ".\main.py") -or -not (Test-Path ".\requirements.txt")) {
  Write-Host "Open PowerShell in the FAKELENS folder containing main.py and requirements.txt." -ForegroundColor Red
  exit 1
}
if (-not (Test-Path ".\.venv\Scripts\python.exe")) { py -m venv .venv }
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "use-a-long-random-secret-for-local-testing" }
& .\.venv\Scripts\python.exe -m uvicorn main:app --reload
