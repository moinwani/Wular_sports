@echo off
echo ========================================
echo Firebase Security Rules Deployment
echo ========================================
echo.

REM Check Firebase CLI
echo Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI not installed!
    echo Install with: npm install -g firebase-tools
    pause
    exit /b 1
)
echo Firebase CLI: OK
echo.

REM Show available projects
echo Your Firebase projects:
firebase projects:list
echo.

REM Prompt for project ID
set /p PROJECT_ID="Enter your Wular Sports Firebase Project ID: "
if "%PROJECT_ID%"=="" (
    echo ERROR: Project ID cannot be empty!
    pause
    exit /b 1
)

REM Update .firebaserc
echo.
echo Updating .firebaserc with project: %PROJECT_ID%
echo {"projects":{"default":"%PROJECT_ID%"}} > .firebaserc
echo Done!
echo.

REM Deploy rules
echo ========================================
echo Deploying Firestore Security Rules
echo ========================================
echo.
echo IMPORTANT: This will replace any existing rules!
echo.
set /p CONFIRM="Continue with deployment? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Deploying...
firebase deploy --only firestore:rules

echo.
echo ========================================
if errorlevel 1 (
    echo DEPLOYMENT FAILED!
    echo Check the error messages above.
) else (
    echo DEPLOYMENT SUCCESSFUL!
    echo.
    echo Next steps:
    echo 1. Verify rules in Firebase Console
    echo 2. Set up admin access: node scripts\admin-setup.js your@email.com
    echo 3. Enable Firebase Auth in console
)
echo ========================================
pause
