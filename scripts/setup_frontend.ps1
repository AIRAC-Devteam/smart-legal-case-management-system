$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\..\frontend"
npm install
if (!(Test-Path ".env.local")) { Copy-Item .env.example .env.local }
Write-Host "Frontend setup finished. Run: npm run dev"
