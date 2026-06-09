# Script to test editorExtension capability and 2.3.0-beta module version

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = "d:\MyProject\minecraft_mod\behavior_packs\PvZ\manifest.json"
$serverExe = "c:\bedrock-server-1.21.111.1\bedrock_server.exe"
$serverDir = "c:\bedrock-server-1.21.111.1"

# Stop server if running
Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Backup manifest.json first
$backupPath = "$manifestPath.bak"
Copy-Item -Path $manifestPath -Destination $backupPath -Force

# Update manifest with editorExtension capability and 2.3.0-beta module
$json = Get-Content $manifestPath -Raw | ConvertFrom-Json
$json.header.min_engine_version = @(1, 14, 0)
$json.capabilities = @("editorExtension")
$json.dependencies = @(
    [PSCustomObject]@{
        module_name = "@minecraft/server"
        version = "2.3.0-beta"
    }
)
$jsonOut = ConvertTo-Json -InputObject $json -Depth 10
$jsonOut | Out-File -FilePath $manifestPath -Encoding utf8

# Deploy
Write-Host "Deploying with editorExtension capability..." -ForegroundColor Cyan
& "d:\MyProject\minecraft_mod\.agent\skills\deploy.ps1" | Out-Null

$logFile = Join-Path $scriptPath "test_editor.log"
$errFile = Join-Path $scriptPath "test_editor_err.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }

# Start server
Write-Host "Starting server..." -ForegroundColor Cyan
$p = Start-Process -FilePath $serverExe -WorkingDirectory $serverDir -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errFile -PassThru

Start-Sleep -Seconds 5

# Stop server
if (-not $p.HasExited) {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}

# Check logs
if (Test-Path $logFile) {
    Write-Host "================ SERVER LOG ================" -ForegroundColor Green
    Get-Content $logFile
    Write-Host "============================================" -ForegroundColor Green
}

# Restore backup manifest
Copy-Item -Path $backupPath -Destination $manifestPath -Force
if (Test-Path $backupPath) { Remove-Item $backupPath -Force }
