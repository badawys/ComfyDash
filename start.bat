@echo off
echo Starting ComfyDash...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Check if npm dependencies are installed
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
)

:: Start the application
echo Starting application...
call npm run dev

pause
