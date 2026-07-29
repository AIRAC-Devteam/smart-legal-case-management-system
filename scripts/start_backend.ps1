$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\..\backend"
& .\.venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8000
