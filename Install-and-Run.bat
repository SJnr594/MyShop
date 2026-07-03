@echo off
title MyShop Desk - Automated Installer & Launcher
color 0B
cls

echo =======================================================================
echo          __  __       ____  _                 _     ____  _____ ____  
echo         ^|  \/  ^|    ^|  _ \^| ^|               ^| ^|   ^|  _ \^|  _  ^| ___^| 
echo         ^| \  / ^|__ _^| ^|_^) ^| ^|_  _  __ _ _ _^| ^|_ _^| ^|_^) ^| ^| ^| ^| \___ \ 
echo         ^| ^|\/^| / _` ^|  __/^| ' \^| ^|/ _` ^| ' \^| ' \/ _` ^|  __^| ^|_^| ^|___) ^|
echo         ^|_^|  ^|_\__,_^|_^|   ^|_^|^|_^|_\__,_^|_^|^|_^|_^|^|_\__,_^|_^|   ^|_____^|____/ 
echo                                                                      
echo =======================================================================
echo.
echo           --- AUTOMATED DESKTOP INSTALLER ^& SERVICE LAUNCHER ---
echo.
echo  This helper script automates the installation and run process for you.
echo  You do not need to open a terminal or type any commands manually.
echo.
echo =======================================================================
echo [STEP 1/3] Checking system prerequisites...
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: Node.js was not found on your system!
    echo.
    echo MyShop Desk requires Node.js to be installed on your computer.
    echo.
    echo To fix this automatically:
    echo   1. Open your web browser and go to: https://nodejs.org
    echo   2. Download and install the "LTS" (Recommended) version.
    echo   3. Once finished, double-click this "Install-and-Run.bat" file again!
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    pause
    exit /b
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js is installed (%NODE_VER%)
echo.

:: Check if node_modules already exists
echo [STEP 2/3] Preparing software libraries and packages...
if not exist "node_modules\" (
    echo.
    echo  ===================================================================
    echo  [!] First-time Setup: Installing app dependencies.
    echo      This might take 1-2 minutes depending on your internet speed.
    echo      Please keep this window open and do not close it...
    echo  ===================================================================
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERROR] Dependency installation failed. Please check your internet connection and try again.
        pause
        exit /b
    )
    echo.
    echo  [OK] Installation completed successfully!
) else (
    echo  [OK] Software libraries are already configured. Skipping install.
)
echo.

:: Open Standalone Desktop App Mode (Borderless window) or Fallback to default browser
echo [STEP 3/3] Launching MyShop Desk standalone desktop terminal...
echo.
echo  ===================================================================
echo  [SUCCESS] Launching local service...
echo  The application is running 100%% offline!
echo  To close MyShop Desk, simply close this command terminal window.
echo  ===================================================================
echo.

:: Pause briefly to let the user read the success message
timeout /t 2 >nul

:: Attempt to open in borderless App Mode (similar to a native desktop app like Office)
set LAUNCHED=0
if exist "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" (
    start "" "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000"
    set LAUNCHED=1
) else if exist "%PROGRAMFILES(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%PROGRAMFILES(x86)%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000"
    set LAUNCHED=1
) else if exist "%PROGRAMFILES%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%PROGRAMFILES%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3000"
    set LAUNCHED=1
)

if %LAUNCHED%==0 (
    :: Fallback to default browser if no Chrome/Edge found
    start "" "http://localhost:3000"
)

:: Start the local web server
call npm run dev

pause
