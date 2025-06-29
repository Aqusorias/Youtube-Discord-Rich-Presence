@echo off
setlocal enabledelayedexpansion


echo ================================================================
echo  Youtube Discord Rich Presence - Setup Script
echo ================================================================
echo.
echo  This script sets up the necessary registry key for Firefox
echo  extensions to communicate with native apps.
echo.
echo  REQUIREMENTS:
echo  - Node.js must be installed and accessible via PATH.
echo.
echo  Press any key to continue and grant administrative privileges.
echo ================================================================
pause >nul


net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)


set "batchDir=%~dp0"
set "batPath=%batchDir%App\ytdrpc.bat"
set "escapedBatPath=%batPath:\=\\%"
set "jsonPath=%batchDir%App\ytdrpc.json"

start "" cmd /c "%batchDir%helper.bat"


reg add "HKLM\SOFTWARE\Mozilla\NativeMessagingHosts\youtube_discord_rich_presence" /f >nul
reg add "HKLM\SOFTWARE\Mozilla\NativeMessagingHosts\youtube_discord_rich_presence" /ve /t REG_SZ /d "%jsonPath%" /f >nul


(
echo {
echo     "name": "youtube_discord_rich_presence",
echo     "description": "Discord Rich Presence for Youtube - native Messaging",
echo     "path": "!escapedBatPath!",
echo     "type": "stdio",
echo     "allowed_extensions": ["youtube_discord_rich_presence@ytdrpc.org"]
echo }
) > "%jsonPath%"


echo.
echo ================================================================
echo  Registry key and manifest JSON file created successfully.
echo  Just add the extension if you haven't, and enjoy!
echo ================================================================
echo.
pause
