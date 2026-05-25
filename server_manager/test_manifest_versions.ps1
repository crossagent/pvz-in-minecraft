# Script to probe and find compatible scripting API versions for the Bedrock Dedicated Server.

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = "d:\MyProject\minecraft_mod\behavior_packs\PvZ\manifest.json"
$serverExe = "C:\bedrock-server-1.21.111.1\bedrock_server.exe"
$serverDir = "C:\bedrock-server-1.21.111.1"

# Stop any running server instances first to prevent file locks
Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Candidate versions to check
$serverApiVersions = @("1.18.0", "1.17.0", "1.16.0", "1.15.0", "1.14.0", "1.13.0", "1.12.0", "1.11.0", "1.10.0", "1.9.0", "1.8.0")
$uiApiVersions = @("1.3.0", "1.2.0", "1.1.0", "1.0.0")

# Backup manifest.json first
$backupPath = "$manifestPath.bak"
Copy-Item -Path $manifestPath -Destination $backupPath -Force

function Update-Manifest {
    param($serverVersion, $uiVersion)
    
    $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    foreach ($dep in $json.dependencies) {
        if ($dep.module_name -eq "@minecraft/server") {
            $dep.version = $serverVersion
        }
        if ($dep.module_name -eq "@minecraft/server-ui") {
            $dep.version = $uiVersion
        }
    }
    
    # Save back
    $jsonOut = ConvertTo-Json -InputObject $json -Depth 10
    $jsonOut | Out-File -FilePath $manifestPath -Encoding utf8
}

Write-Host "Starting API version compatibility test..." -ForegroundColor Cyan

$foundMatch = $false
$workingServerVer = ""
$workingUiVer = ""

foreach ($serverVer in $serverApiVersions) {
    foreach ($uiVer in $uiApiVersions) {
        Write-Host "Testing @minecraft/server: $serverVer, @minecraft/server-ui: $uiVer..." -ForegroundColor Yellow
        
        # 1. Update manifest
        Update-Manifest -serverVersion $serverVer -uiVersion $uiVer
        
        # 2. Deploy updated packs
        & "d:\MyProject\minecraft_mod\.agent\skills\deploy.ps1" | Out-Null
        
        # 3. Start server redirecting output to a file
        $logFile = Join-Path $scriptPath "test_run.log"
        $errFile = Join-Path $scriptPath "test_err.log"
        if (Test-Path $logFile) { Remove-Item $logFile -Force }
        if (Test-Path $errFile) { Remove-Item $errFile -Force }
        
        # Start server process using Start-Process with redirection
        $p = Start-Process -FilePath $serverExe -WorkingDirectory $serverDir -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errFile -PassThru
        
        # Wait 2.5 seconds for server initialization and script compilation
        Start-Sleep -Milliseconds 2500
        
        # Kill the process
        if (-not $p.HasExited) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
        
        # Read log content
        $consoleOutput = ""
        if (Test-Path $logFile) {
            $consoleOutput += Get-Content $logFile -Raw
            Remove-Item $logFile -Force
        }
        if (Test-Path $errFile) {
            $consoleOutput += Get-Content $errFile -Raw
            Remove-Item $errFile -Force
        }
        
        # 4. Check if error is present in the output
        if ($consoleOutput -match "unrecognized" -or $consoleOutput -match "failed to load" -or -not $consoleOutput) {
            Write-Host "  -> Result: FAILED (unrecognized module or empty output)" -ForegroundColor Red
        } else {
            # Let's verify standard load log
            if ($consoleOutput -match "SERVER" -and $consoleOutput -match "PvZ") {
                Write-Host "  -> Result: SUCCESS!" -ForegroundColor Green
                $foundMatch = $true
                $workingServerVer = $serverVer
                $workingUiVer = $uiVer
                break
            } else {
                Write-Host "  -> Result: FAILED (server did not boot or log correctly)" -ForegroundColor Red
            }
        }
    }
    if ($foundMatch) { break }
}

# Restore manifest backup
if (-not $foundMatch) {
    Write-Warning "Could not find a working version automatically. Restoring backup manifest."
    Copy-Item -Path $backupPath -Destination $manifestPath -Force
} else {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " SUCCESSFUL COMBINATION FOUND:" -ForegroundColor Green
    Write-Host " @minecraft/server: $workingServerVer" -ForegroundColor Green
    Write-Host " @minecraft/server-ui: $workingUiVer" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    
    # Save the working versions to the manifest
    Update-Manifest -serverVersion $workingServerVer -uiVersion $workingUiVer
    # Redeploy the final working files
    & "d:\MyProject\minecraft_mod\.agent\skills\deploy.ps1" | Out-Null
}

if (Test-Path $backupPath) { Remove-Item $backupPath -Force }
