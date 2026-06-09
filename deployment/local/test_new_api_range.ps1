# Script to probe and find compatible scripting API versions (1.15.0 to 1.26.0-beta)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = "d:\MyProject\minecraft_mod\behavior_packs\PvZ\manifest.json"
$serverExe = "d:\MyProject\minecraft_mod\bedrock-server\bedrock_server.exe"
$serverDir = "d:\MyProject\minecraft_mod\bedrock-server"

# Stop any running server instances first to prevent file locks
Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# List of versions to test
$serverApiVersions = @(
    # Stable versions
    "1.15.0", "1.16.0", "1.17.0", "1.18.0", "1.19.0", "1.20.0", "1.21.0", "1.22.0", "1.23.0", "1.24.0", "1.25.0", "1.26.0",
    # Beta versions
    "1.15.0-beta", "1.16.0-beta", "1.17.0-beta", "1.18.0-beta", "1.19.0-beta", "1.20.0-beta", "1.21.0-beta", "1.22.0-beta", "1.23.0-beta", "1.24.0-beta", "1.25.0-beta", "1.26.0-beta"
)

# Backup manifest.json first
$backupPath = "$manifestPath.bak"
Copy-Item -Path $manifestPath -Destination $backupPath -Force

function Update-Manifest {
    param($serverVersion)
    
    $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    # Set min_engine_version to 1.26.21 since it's a preview server
    $json.header.min_engine_version = @(1, 26, 21)
    
    # Set dependencies to only contain @minecraft/server
    $newDeps = @(
        [PSCustomObject]@{
            module_name = "@minecraft/server"
            version = $serverVersion
        }
    )
    
    $json.dependencies = $newDeps
    
    # Save back
    $jsonOut = ConvertTo-Json -InputObject $json -Depth 10
    $jsonOut | Out-File -FilePath $manifestPath -Encoding utf8
}

Write-Host "Starting @minecraft/server version range test..." -ForegroundColor Cyan

$foundMatch = $false
$workingServerVer = ""

foreach ($serverVer in $serverApiVersions) {
    Write-Host "Testing @minecraft/server: $serverVer..." -ForegroundColor Yellow
    
    # Ensure any old instances are hard-killed before testing
    Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Seconds 1
    
    # 1. Update manifest
    Update-Manifest -serverVersion $serverVer
    
    # 2. Deploy updated packs
    & "d:\MyProject\minecraft_mod\.agent\skills\deploy.ps1" | Out-Null
    
    # 3. Start server redirecting output to separate files
    $safeServerVer = $serverVer.Replace(".", "_")
    $logFile = Join-Path $scriptPath "range_${safeServerVer}.log"
    $errFile = Join-Path $scriptPath "range_err_${safeServerVer}.log"
    if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }
    
    # Start server process
    $p = Start-Process -FilePath $serverExe -WorkingDirectory $serverDir -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errFile -PassThru
    
    # Wait 4 seconds for server initialization and script compilation
    Start-Sleep -Milliseconds 4000
    
    # Kill the process
    if (-not $p.HasExited) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Read log content
    $consoleOutput = ""
    if (Test-Path $logFile) {
        $consoleOutput += Get-Content $logFile -Raw
        Remove-Item $logFile -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $errFile) {
        $consoleOutput += Get-Content $errFile -Raw
        Remove-Item $errFile -Force -ErrorAction SilentlyContinue
    }
    
    # Check for unrecognized native module error or invalid version
    if ($consoleOutput -match "unrecognized" -or $consoleOutput -match "failed to load" -or $consoleOutput -match "ReferenceError" -or $consoleOutput -match "failed to create context" -or $consoleOutput -match "invalid version" -or $consoleOutput -match "version conflict" -or $consoleOutput -match "run failed" -or -not $consoleOutput) {
        Write-Host "  -> Result: FAILED" -ForegroundColor Red
        # Print relevant error lines
        $consoleOutput -split "`n" | Where-Object { $_ -match "ERROR" -or $_ -match "WARN" -or $_ -match "unrecognized" -or $_ -match "invalid version" } | ForEach-Object {
            Write-Host "     $_" -ForegroundColor DarkYellow
        }
    } else {
        if ($consoleOutput -match "Server started." -and $consoleOutput -match "PvZ") {
            Write-Host "  -> Result: SUCCESS!" -ForegroundColor Green
            $foundMatch = $true
            $workingServerVer = $serverVer
            break
        } else {
            Write-Host "  -> Result: FAILED (server did not boot or log correctly)" -ForegroundColor Red
        }
    }
}

# Restore manifest backup
if (-not $foundMatch) {
    Write-Warning "Could not find a working version automatically. Restoring backup manifest."
    Copy-Item -Path $backupPath -Destination $manifestPath -Force
} else {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " SUCCESSFUL VERSION FOUND:" -ForegroundColor Green
    Write-Host " @minecraft/server: $workingServerVer" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    
    # Save the working version to the manifest
    Update-Manifest -serverVersion $workingServerVer
    # Redeploy
    & "d:\MyProject\minecraft_mod\deployment\local\deploy.ps1" | Out-Null
}

if (Test-Path $backupPath) { Remove-Item $backupPath -Force }
