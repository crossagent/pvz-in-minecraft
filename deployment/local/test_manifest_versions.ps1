# Script to probe and find compatible scripting API versions for the Bedrock Dedicated Server.

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = "d:\MyProject\minecraft_mod\behavior_packs\PvZ\manifest.json"
$serverExe = "c:\bedrock-server-1.21.111.1\bedrock_server.exe"
$serverDir = "c:\bedrock-server-1.21.111.1"

# Stop any running server instances first to prevent file locks
Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Candidate versions to check
$serverApiVersions = @("1.19.0", "2.7.0", "2.8.0-beta", "3.0.0-alpha")
$uiApiVersions = @("1.3.0", "2.0.0", "2.1.0-beta", "3.0.0-alpha")

# Backup manifest.json first
$backupPath = "$manifestPath.bak"
Copy-Item -Path $manifestPath -Destination $backupPath -Force

function Update-Manifest {
    param($serverVersion, $uiVersion)
    
    $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    $hasServer = $false
    $hasUi = $false
    $newDeps = @()
    
    foreach ($dep in $json.dependencies) {
        if ($dep.module_name -eq "@minecraft/server") {
            $dep.version = $serverVersion
            $hasServer = $true
            $newDeps += $dep
        }
        elseif ($dep.module_name -eq "@minecraft/server-ui") {
            $dep.version = $uiVersion
            $hasUi = $true
            $newDeps += $dep
        }
        else {
            $newDeps += $dep
        }
    }
    
    if (-not $hasServer) {
        $newDeps += [PSCustomObject]@{
            module_name = "@minecraft/server"
            version = $serverVersion
        }
    }
    if (-not $hasUi) {
        $newDeps += [PSCustomObject]@{
            module_name = "@minecraft/server-ui"
            version = $uiVersion
        }
    }
    
    $json.dependencies = $newDeps
    
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
        $retryCount = 0
        $maxRetries = 2
        $success = $false
        
        while ($retryCount -le $maxRetries) {
            Write-Host "Testing @minecraft/server: $serverVer, @minecraft/server-ui: $uiVer (Attempt $($retryCount + 1))..." -ForegroundColor Yellow
            
            # Ensure any old instances are hard-killed before testing
            Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue | Out-Null
            Start-Sleep -Seconds 1
            
            # 1. Update manifest
            Update-Manifest -serverVersion $serverVer -uiVersion $uiVer
            
            # 2. Deploy updated packs
            & "d:\MyProject\minecraft_mod\deployment\local\deploy.ps1" | Out-Null
            
            # 3. Start server redirecting output to a file
            $safeServerVer = $serverVer.Replace(".", "_")
            $safeUiVer = $uiVer.Replace(".", "_")
            $logFile = Join-Path $scriptPath "test_run_${safeServerVer}_${safeUiVer}_${retryCount}.log"
            $errFile = Join-Path $scriptPath "test_err_${safeServerVer}_${safeUiVer}_${retryCount}.log"
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
            
            # Check for port conflict
            if ($consoleOutput -match "Port \[19132\] may be in use" -or $consoleOutput -match "Port \[19133\] may be in use") {
                Write-Warning "  -> Port conflict detected! Retrying after cleanup..."
                Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue | Out-Null
                Start-Sleep -Seconds 2
                $retryCount++
                continue
            }
            
            # 4. Check if error is present in the output
            if ($consoleOutput -match "unrecognized" -or $consoleOutput -match "failed to load" -or $consoleOutput -match "ReferenceError" -or $consoleOutput -match "failed to create context" -or $consoleOutput -match "invalid version" -or $consoleOutput -match "version conflict" -or $consoleOutput -match "run failed" -or -not $consoleOutput) {
                Write-Host "  -> Result: FAILED" -ForegroundColor Red
                # Print the relevant error details
                $consoleOutput -split "`n" | Where-Object { $_ -match "ERROR" -or $_ -match "WARN" -or $_ -match "conflict" -or $_ -match "unrecognized" -or $_ -match "requested" } | ForEach-Object {
                    Write-Host "     $_" -ForegroundColor DarkYellow
                }
            } else {
                # Let's verify standard load log
                if ($consoleOutput -match "Server started." -and $consoleOutput -match "PvZ") {
                    Write-Host "  -> Result: SUCCESS!" -ForegroundColor Green
                    $foundMatch = $true
                    $workingServerVer = $serverVer
                    $workingUiVer = $uiVer
                    $success = $true
                    break
                } else {
                    Write-Host "  -> Result: FAILED (server did not boot or log correctly)" -ForegroundColor Red
                }
            }
            break
        }
        if ($success) { break }
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
