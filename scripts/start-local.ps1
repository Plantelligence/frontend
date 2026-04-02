param(
    [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

Write-Host "=== Plantelligence Frontend :: Local Startup ===" -ForegroundColor Cyan

if (-not $NoInstall) {
    Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
    npm install
}

Write-Host "Launching frontend dev server (npm run dev)..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray

npm run dev
