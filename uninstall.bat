@echo off
setlocal

echo ================================================================
echo  Youtube Discord Rich Presence - Uninstall Script
echo ================================================================
echo.
echo  This script removes the registry key for the
echo  "youtube_discord_rich_presence" native messaging host.
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


reg delete "HKLM\SOFTWARE\Mozilla\NativeMessagingHosts\youtube_discord_rich_presence" /f >nul 2>&1
if %errorLevel% EQU 0 (
    echo.
    echo Registry key successfully removed.
) else (
    echo.
    echo Registry key not found or failed to remove.
)

echo.
echo ================================================================
echo  Removal complete.
echo  Now you can just delete the files and remove the extension.
echo ================================================================
echo.
pause
