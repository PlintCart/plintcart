# Deployment Fix Script for PlintCart (PowerShell)

Write-Host "🚀 Deploying with MIME type and COOP fixes..." -ForegroundColor Green

# Clear any cached builds
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force "node_modules\.vite" }

Write-Host "📦 Building with fresh cache..." -ForegroundColor Yellow
npm run build

Write-Host "🔍 Checking built files..." -ForegroundColor Cyan
Get-ChildItem "dist\assets\*.js" | Select-Object -First 5 | ForEach-Object { Write-Host $_.Name }
Get-ChildItem "dist\assets\*.css" | Select-Object -First 5 | ForEach-Object { Write-Host $_.Name }

Write-Host "📋 Verifying headers configuration..." -ForegroundColor Magenta
Get-Content "public\_headers" | Select-Object -First 15

Write-Host "🌐 Ready for deployment!" -ForegroundColor Green
Write-Host "After deploying, test: https://plintcart.io" -ForegroundColor Yellow
Write-Host "If issues persist, clear browser cache (Ctrl+F5) and try again." -ForegroundColor Yellow
