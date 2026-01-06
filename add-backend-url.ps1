# PowerShell script to add VITE_RAZORPAY_BACKEND_URL to .env.local
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Adding Razorpay Backend URL to .env.local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"
$backendUrl = "VITE_RAZORPAY_BACKEND_URL=https://wularsports.com/api"

# Check if .env.local exists
if (-Not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local file first with your keys." -ForegroundColor Yellow
    pause
    exit
}

# Read current content
$content = Get-Content $envFile -Raw

# Check if the variable already exists
if ($content -match "VITE_RAZORPAY_BACKEND_URL") {
    Write-Host "✓ VITE_RAZORPAY_BACKEND_URL already exists in .env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current line:" -ForegroundColor Yellow
    $content -split "`n" | Where-Object { $_ -match "VITE_RAZORPAY_BACKEND_URL" } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
    }
    Write-Host ""
    $response = Read-Host "Do you want to update it? (y/n)"
    if ($response -ne "y") {
        Write-Host "Skipped. No changes made." -ForegroundColor Yellow
        pause
        exit
    }
    # Remove old line
    $content = ($content -split "`n" | Where-Object { $_ -notmatch "VITE_RAZORPAY_BACKEND_URL" }) -join "`n"
}

# Add the new line
$newContent = $content.TrimEnd() + "`n`n# Razorpay Backend API URL`n" + $backendUrl + "`n"

# Write back to file
Set-Content -Path $envFile -Value $newContent -NoNewline

Write-Host ""
Write-Host "✓ Successfully added VITE_RAZORPAY_BACKEND_URL to .env.local!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Restart your dev server" -ForegroundColor Cyan
Write-Host "  Option 1: Double-click restart-dev-server.bat" -ForegroundColor White
Write-Host "  Option 2: Manually stop (Ctrl+C) and run 'npm run dev'" -ForegroundColor White
Write-Host ""
pause
