# Script to deploy behavior pack and resource pack to the local Minecraft UWP game client.

$clientPath = "C:\Users\zxy19\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang"

if (-not (Test-Path $clientPath)) {
    Write-Error "Error: Local Minecraft client path not found: $clientPath"
    exit 1
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path # deployment\local
$deploymentPath = Split-Path -Parent $scriptPath             # deployment
$rootPath = Split-Path -Parent $deploymentPath               # workspace root

# Source directories
$sourceBP = Join-Path $rootPath "behavior_packs\PvZ"
$sourceRP = Join-Path $rootPath "resource_packs\PvZ"

# Destination directories
$destBP = Join-Path $clientPath "development_behavior_packs\PvZ"
$destRP = Join-Path $clientPath "development_resource_packs\PvZ"

# Deploy Behavior Pack
Write-Host "Deploying Behavior Pack to local client..." -ForegroundColor Yellow
if (Test-Path $destBP) {
    Remove-Item -Path $destBP -Recurse -Force | Out-Null
}
Copy-Item -Path $sourceBP -Destination $destBP -Recurse -Force
Write-Host "Behavior Pack deployed to: $destBP" -ForegroundColor Green

# Deploy Resource Pack
Write-Host "Deploying Resource Pack to local client..." -ForegroundColor Yellow
if (Test-Path $destRP) {
    Remove-Item -Path $destRP -Recurse -Force | Out-Null
}
Copy-Item -Path $sourceRP -Destination $destRP -Recurse -Force
Write-Host "Resource Pack deployed to: $destRP" -ForegroundColor Green

Write-Host "Deployment completed successfully! Open Minecraft and create a world with Beta APIs enabled." -ForegroundColor Green
