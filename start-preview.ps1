$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $repoRoot

Write-Host ""
Write-Host "Starting Frame Catalog preview..." -ForegroundColor Cyan
Write-Host "Open http://127.0.0.1:4173 in your browser." -ForegroundColor Green
Write-Host "Keep this window open while previewing. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

& 'C:\Program Files\nodejs\node.exe' preview-server.js
