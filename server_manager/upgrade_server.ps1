# PowerShell script to upgrade Minecraft Bedrock Dedicated Server safely.

# 1. Load .env path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
$envFile = Join-Path $rootPath ".env"

if (-not (Test-Path $envFile)) {
    Write-Error "Error: .env file not found at $envFile."
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
    Write-Error "Error: MINECRAFT_SERVER_PATH in .env is invalid: $serverPath"
    exit 1
}

Write-Host "Current Server Path: $serverPath" -ForegroundColor Cyan

# 2. Get target version from user
$version = Read-Host "Enter the Minecraft Bedrock Server Version to download (e.g. 1.21.111.01)"
$version = $version.Trim()

if (-not $version) {
    Write-Error "Error: Version cannot be empty."
    exit 1
}

# Construct download URL (standard Mojang format)
$downloadUrl = "https://www.minecraft.net/bedrockdedicatedserver/bin-win/bedrock-server-$version.zip"
Write-Host "Constructed URL: $downloadUrl" -ForegroundColor Cyan

# 3. Stop running server process to avoid file locking
$processes = Get-Process -Name "bedrock_server" -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "Stopping running bedrock_server processes..." -ForegroundColor Yellow
    Stop-Process -Name "bedrock_server" -Force
    Start-Sleep -Seconds 2
}

# 4. Prepare directories
$tempDir = Join-Path $scriptPath "temp_upgrade"
$backupDir = Join-Path $scriptPath "backup_data"
$zipPath = Join-Path $scriptPath "bedrock-server-$version.zip"

if (Test-Path $tempDir) { Remove-Item -Path $tempDir -Recurse -Force }
if (Test-Path $backupDir) { Remove-Item -Path $backupDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 5. Backup important configurations and worlds from the server directory
Write-Host "Backing up server data (worlds, properties, configurations)..." -ForegroundColor Yellow

$itemsToBackup = @("worlds", "server.properties", "allowlist.json", "permissions.json")
foreach ($item in $itemsToBackup) {
    $sourceItem = Join-Path $serverPath $item
    if (Test-Path $sourceItem) {
        $destItem = Join-Path $backupDir $item
        Copy-Item -Path $sourceItem -Destination $destItem -Recurse -Force
        Write-Host "Backed up: $item" -ForegroundColor Green
    }
}

# 6. Download the new version
Write-Host "Downloading version $version from Mojang..." -ForegroundColor Yellow
try {
    # Set User-Agent as Mojang servers block generic web requests
    $userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UserAgent $userAgent -Verbose
    Write-Host "Download completed successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to download from $downloadUrl. Please verify the version number and internet connection."
    # Restore server process or backup if needed?
    exit 1
}

# 7. Extract the downloaded zip
Write-Host "Extracting files..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

# 8. Copy new files into the server directory
Write-Host "Updating server binaries..." -ForegroundColor Yellow
$extractedFiles = Get-ChildItem -Path $tempDir
foreach ($file in $extractedFiles) {
    # Do not copy worlds or properties templates, to prevent overwriting user changes
    if ($file.Name -ne "worlds" -and $file.Name -ne "server.properties") {
        $destPath = Join-Path $serverPath $file.Name
        if ($file.PSIsContainer) {
            Copy-Item -Path $file.FullName -Destination $destPath -Recurse -Force
        } else {
            Copy-Item -Path $file.FullName -Destination $destPath -Force
        }
    }
}

# 9. Restore backups to guarantee data integrity
Write-Host "Restoring backups..." -ForegroundColor Yellow
foreach ($item in $itemsToBackup) {
    $backupItem = Join-Path $backupDir $item
    if (Test-Path $backupItem) {
        $destItem = Join-Path $serverPath $item
        if (Test-Path $destItem) {
            if ($item -eq "worlds") {
                # Merge worlds folder content rather than deleting the folder itself to preserve custom files
                Copy-Item -Path "$backupItem\*" -Destination $destItem -Recurse -Force
            } else {
                Copy-Item -Path $backupItem -Destination $destItem -Force
            }
        } else {
            Copy-Item -Path $backupItem -Destination $destItem -Recurse -Force
        }
        Write-Host "Restored: $item" -ForegroundColor Green
    }
}

# 10. Cleanup temp files
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force
Remove-Item -Path $backupDir -Recurse -Force
Remove-Item -Path $zipPath -Force

Write-Host "Minecraft Server upgraded successfully to version $version!" -ForegroundColor Green
Write-Host "You can now run 'start_server.bat' to launch the updated server." -ForegroundColor Green
