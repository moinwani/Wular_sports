@echo off
echo ========================================
echo Restarting Development Server
echo ========================================
echo.

REM Kill any existing npm/node processes for this project
echo Stopping any running dev servers...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting dev server...
cd /d "%~dp0"
start "Wular Sports Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Dev server is starting in a new window!
echo ========================================
echo.
echo Check the new terminal window for the server URL
echo (usually http://localhost:5173)
echo.
pause
