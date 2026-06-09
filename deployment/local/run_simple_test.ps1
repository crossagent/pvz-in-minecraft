# Script to run a simple server startup test and dump logs

$serverExe = "d:\MyProject\minecraft_mod\bedrock-server\bedrock_server.exe"
$serverDir = "d:\MyProject\minecraft_mod\bedrock-server"
$logFile = "d:\MyProject\minecraft_mod\scratch\simple_test.log"
$errFile = "d:\MyProject\minecraft_mod\scratch\simple_err.log"

# Stop server if running
Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 1. Deploy
Write-Host "Deploying packs..." -ForegroundColor Cyan
& "d:\MyProject\minecraft_mod\.agent\skills\deploy.ps1" | Out-Null

# Remove old logs
if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }

# 2. Start server
Write-Host "Starting server..." -ForegroundColor Cyan
$p = Start-Process -FilePath $serverExe -WorkingDirectory $serverDir -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errFile -PassThru

# Wait 15 seconds
Start-Sleep -Seconds 15

# Kill server
Write-Host "Stopping server..." -ForegroundColor Cyan
if (-not $p.HasExited) {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}

# Dump log content
if (Test-Path $logFile) {
    Write-Host "================ SERVER LOG ================" -ForegroundColor Green
    Get-Content $logFile
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Error "Log file was not generated!"
}

if (Test-Path $errFile) {
    $errContent = Get-Content $errFile -Raw
    if ($errContent) {
        Write-Host "================ SERVER ERR ================" -ForegroundColor Red
        Write-Host $errContent -ForegroundColor DarkRed
        Write-Host "============================================" -ForegroundColor Red
    }
}
