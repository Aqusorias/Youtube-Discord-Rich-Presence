@echo off
REM
where node >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH.
    goto end
)

REM
where npm >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not installed or not in PATH.
    goto end
)

REM
cd /d "%~dp0App"
if errorlevel 1 (
    echo Error: Could not change directory to App.
    goto end
)

npm install

:end
