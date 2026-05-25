@echo off
title Minecraft Bedrock Server Upgrader
cd /d "%~dp0"

:: Check if running as administrator (some systems require admin privileges to write to C: root)
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Some folders on C: drive require Administrator privileges.
    echo If the upgrade fails, please right-click this script and select 'Run as Administrator'.
    echo.
)

powershell -NoProfile -ExecutionPolicy Bypass -File "upgrade_server.ps1"

echo.
echo Press any key to exit...
pause >nul
