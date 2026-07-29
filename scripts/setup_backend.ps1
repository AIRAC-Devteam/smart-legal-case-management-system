$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\..\backend"
if (!(Test-Path ".venv")) { python -m venv .venv }
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
if (!(Test-Path ".env")) { Copy-Item .env.example .env }
python manage.py migrate
Write-Host "Backend setup finished. Edit backend/.env, then run: python manage.py runserver"
