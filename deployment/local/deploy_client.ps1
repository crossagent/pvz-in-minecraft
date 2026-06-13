# Script to deploy Minecraft Bedrock Add-on to the local client (Option A)

# 1. Load environment variables from .env
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path # deployment\local
$deploymentPath = Split-Path -Parent $scriptPath             # deployment
$rootPath = Split-Path -Parent $deploymentPath               # workspace root
$envFile = Join-Path $rootPath ".env"

$clientPath = ""
if (Test-Path $envFile) {
    $env = @{}
    Get-Content $envFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        $env[$key] = $val
    }
    $clientPath = $env["MINECRAFT_CLIENT_PATH"]
}

if (-not $clientPath) {
    # Default UWP path
    $clientPath = "$env:LOCALAPPDATA\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang"
}

if (-not (Test-Path $clientPath)) {
    Write-Error "Error: Minecraft client directory not found at $clientPath"
    exit 1
}

Write-Host "Minecraft Client Path: $clientPath" -ForegroundColor Cyan

# 2. Source folders
$sourceBPDir = Join-Path $rootPath "behavior_packs"
$sourceRPDir = Join-Path $rootPath "resource_packs"

# Target folders
$targetBPDir = Join-Path $clientPath "development_behavior_packs"
$targetRPDir = Join-Path $clientPath "development_resource_packs"

# Create targets if they don't exist
if (-not (Test-Path $targetBPDir)) { New-Item -ItemType Directory -Path $targetBPDir -Force | Out-Null }
if (-not (Test-Path $targetRPDir)) { New-Item -ItemType Directory -Path $targetRPDir -Force | Out-Null }

# Helper to deploy packs
function Deploy-Packs {
    param (
        [string]$sourceDir,
        [string]$targetDir,
        [string]$packType
    )

    if (-not (Test-Path $sourceDir)) {
        Write-Host "No $packType packs found at $sourceDir."
        return
    }

    $packs = Get-ChildItem -Directory -Path $sourceDir
    foreach ($pack in $packs) {
        $packName = $pack.Name
        $srcPackPath = $pack.FullName
        $destPackPath = Join-Path $targetDir $packName

        Write-Host "Deploying $packType pack to client: $packName..." -ForegroundColor Yellow

        if (Test-Path $destPackPath) {
            Remove-Item -Path $destPackPath -Recurse -Force
        }
        Copy-Item -Path $srcPackPath -Destination $destPackPath -Recurse -Force
        Write-Host "Successfully deployed $packName to $destPackPath" -ForegroundColor Green
    }
}

Deploy-Packs -sourceDir $sourceBPDir -targetDir $targetBPDir -packType "behavior"
Deploy-Packs -sourceDir $sourceRPDir -targetDir $targetRPDir -packType "resource"

Write-Host "Client deployment completed successfully!" -ForegroundColor Green
Write-Host "To test: 1. Launch Minecraft Client, 2. Create/edit a world, 3. Turn on 'Beta API' in Experiments, 4. Enable both Behavior and Resource packs under Active packs." -ForegroundColor Yellow
