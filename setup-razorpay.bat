@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Adding Razorpay Backend URL to .env.local
echo ========================================
echo.

if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please create .env.local file first.
    pause
    exit /b 1
)

REM Check if the variable already exists
findstr /C:"VITE_RAZORPAY_BACKEND_URL" ".env.local" >nul
if %errorlevel%==0 (
    echo VITE_RAZORPAY_BACKEND_URL already exists in .env.local
    echo.
    findstr /C:"VITE_RAZORPAY_BACKEND_URL" ".env.local"
    echo.
    set /p confirm="Do you want to continue anyway? (y/n): "
    if /i not "!confirm!"=="y" (
        echo Cancelled.
        pause
        exit /b 0
    )
) else (
    echo Adding VITE_RAZORPAY_BACKEND_URL to .env.local...
    echo. >> ".env.local"
    echo # Razorpay Backend API URL >> ".env.local"
    echo VITE_RAZORPAY_BACKEND_URL=https://wularsports.com/api >> ".env.local"
    echo.
    echo ✓ Successfully added VITE_RAZORPAY_BACKEND_URL!
)

echo.
echo ========================================
echo Next Step: Restart Dev Server
echo ========================================
echo.
echo Choose an option:
echo   1. Restart dev server automatically
echo   2. I'll restart it manually
echo.
set /p choice="Enter choice (1 or 2): "

if "!choice!"=="1" (
    echo.
    echo Restarting dev server...
    call restart-dev-server.bat
) else (
    echo.
    echo Please restart your dev server manually:
    echo   1. Press Ctrl+C in the terminal running npm run dev
    echo   2. Run: npm run dev
)

echo.
pause
