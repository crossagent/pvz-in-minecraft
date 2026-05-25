@echo off
title Minecraft Bedrock Server Launcher
setlocal enabledelayedexpansion

:: Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found in current directory.
    echo Please create a .env file with: MINECRAFT_SERVER_PATH=C:\your\server\path
    pause
    exit /b 1
)

:: Read MINECRAFT_SERVER_PATH from .env
set SERVER_PATH=
for /f "usebackq tokens=1,2 delims==" %%i in (".env") do (
    set "key=%%i"
    set "val=%%j"
    
    :: Remove leading/trailing spaces from key and value
    for /f "tokens=*" %%a in ("!key!") do set "key=%%a"
    for /f "tokens=*" %%a in ("!val!") do set "val=%%a"
    
    :: Skip comments
    echo !key! | findstr /r "^#" >nul
    if errorlevel 1 (
        if "!key!"=="MINECRAFT_SERVER_PATH" (
            set "SERVER_PATH=!val!"
        )
    )
)

:: Check if path is empty
if "!SERVER_PATH!"=="" (
    echo [ERROR] MINECRAFT_SERVER_PATH is not defined in .env file.
    pause
    exit /b 1
)

:: Check if directory exists
if not exist "!SERVER_PATH!" (
    echo [ERROR] Server directory does not exist: !SERVER_PATH!
    pause
    exit /b 1
)

echo ===================================================
echo  Starting Minecraft Bedrock Dedicated Server
echo  Path: !SERVER_PATH!
echo ===================================================
echo.

cd /d "!SERVER_PATH!"
if not exist bedrock_server.exe (
    echo [ERROR] bedrock_server.exe was not found in !SERVER_PATH!.
    pause
    exit /b 1
)

bedrock_server.exe

echo.
echo ===================================================
echo  Server stopped.
echo ===================================================
pause
