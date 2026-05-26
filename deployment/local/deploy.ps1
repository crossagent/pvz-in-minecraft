# Script to build and deploy Minecraft Bedrock Add-on to the server.

# 1. Load environment variables from .env
# This script is located in .agent\skills\deploy.ps1, so the root path is two levels up.
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path # deployment\local
$deploymentPath = Split-Path -Parent $scriptPath             # deployment
$rootPath = Split-Path -Parent $deploymentPath               # workspace root
$envFile = Join-Path $rootPath ".env"

if (-not (Test-Path $envFile)) {
    Write-Error "Error: .env file not found at $envFile. Please create one with MINECRAFT_SERVER_PATH=<path>"
    exit 1
}

$env = @{}
Get-Content $envFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
    $parts = $_ -split '=', 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim()
    $env[$key] = $val
}

$serverPath = $env["MINECRAFT_SERVER_PATH"]
if (-not $serverPath -or -not (Test-Path $serverPath)) {
    Write-Error "Error: MINECRAFT_SERVER_PATH is not set correctly in .env or directory does not exist: $serverPath"
    exit 1
}

Write-Host "Minecraft Server Path: $serverPath" -ForegroundColor Cyan

# 2. Parse server.properties to find the active world level-name
$serverPropsFile = Join-Path $serverPath "server.properties"
$levelName = "Bedrock level" # Default
if (Test-Path $serverPropsFile) {
    Get-Content $serverPropsFile | Where-Object { $_ -match '^level-name=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $val = $parts[1].Trim()
        if ($val) { $levelName = $val }
    }
}
Write-Host "Active World Level Name: $levelName" -ForegroundColor Cyan

$worldDir = Join-Path $serverPath "worlds" | Join-Path -ChildPath $levelName
if (-not (Test-Path $worldDir)) {
    Write-Warning "Warning: World directory does not exist yet: $worldDir. It will be created when the server runs."
    New-Item -ItemType Directory -Path $worldDir -Force | Out-Null
}

# 3. Source folders
$sourceBPDir = Join-Path $rootPath "behavior_packs"
$sourceRPDir = Join-Path $rootPath "resource_packs"

# Target folders (deploying to development folders for hot reload support)
$targetBPDir = Join-Path $serverPath "development_behavior_packs"
$targetRPDir = Join-Path $serverPath "development_resource_packs"

# Create targets if they don't exist
if (-not (Test-Path $targetBPDir)) { New-Item -ItemType Directory -Path $targetBPDir -Force | Out-Null }
if (-not (Test-Path $targetRPDir)) { New-Item -ItemType Directory -Path $targetRPDir -Force | Out-Null }

# Helper to deploy packs and register them
function Deploy-Packs {
    param (
        [string]$sourceDir,
        [string]$targetDir,
        [string]$packType # "behavior" or "resource"
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

        Write-Host "Deploying $packType pack: $packName..." -ForegroundColor Yellow

        # Sync directories by cleaning destination first
        if (Test-Path $destPackPath) {
            Remove-Item -Path $destPackPath -Recurse -Force
        }
        Copy-Item -Path $srcPackPath -Destination $destPackPath -Recurse -Force

        # Read manifest to register in world
        $manifestPath = Join-Path $srcPackPath "manifest.json"
        if (Test-Path $manifestPath) {
            $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
            $uuid = $manifest.header.uuid
            $version = $manifest.header.version # Array of numbers

            # Register in world configs
            Register-PackInWorld -uuid $uuid -version $version -packType $packType
        }
        else {
            Write-Warning "Warning: No manifest.json found in $packName."
        }
    }
}

# Helper to register pack in world json
function Register-PackInWorld {
    param (
        [string]$uuid,
        [int[]]$version,
        [string]$packType
    )

    $jsonFile = ""
    if ($packType -eq "behavior") {
        $jsonFile = Join-Path $worldDir "world_behavior_packs.json"
    }
    else {
        $jsonFile = Join-Path $worldDir "world_resource_packs.json"
    }

    $entries = @()
    if (Test-Path $jsonFile) {
        $content = Get-Content $jsonFile -Raw
        if ($content.Trim()) {
            $entries = ConvertFrom-Json $content
            # Convert to array if it is a single object
            if ($entries -isnot [array]) {
                $entries = @($entries)
            }
        }
    }

    # Check if already exists
    $exists = $false
    foreach ($entry in $entries) {
        if ($entry.pack_id -eq $uuid) {
            $entry.version = $version
            $exists = $true
            break
        }
    }

    if (-not $exists) {
        $newEntry = [PSCustomObject]@{
            pack_id = $uuid
            version = $version
        }
        $entries += $newEntry
    }

    # Reconstruct to prevent nesting and ensure correct array formatting
    $cleanList = @()
    foreach ($entry in $entries) {
        $vArray = @()
        foreach ($v in $entry.version) { $vArray += [int]$v }
        $cleanList += [PSCustomObject]@{
            pack_id = $entry.pack_id.ToString()
            version = $vArray
        }
    }

    # Convert back to JSON and save
    $jsonOut = ConvertTo-Json -InputObject $cleanList -Depth 5
    $jsonOut | Out-File -FilePath $jsonFile -Encoding utf8
    Write-Host "Registered/updated $packType pack $uuid (v$($version -join '.')) in $jsonFile." -ForegroundColor Green
}

# Run deployment
Deploy-Packs -sourceDir $sourceBPDir -targetDir $targetBPDir -packType "behavior"
Deploy-Packs -sourceDir $sourceRPDir -targetDir $targetRPDir -packType "resource"

Write-Host "Deployment completed successfully! Run /reload in Minecraft console." -ForegroundColor Green
