# Script to test different min_engine_version settings combined with @minecraft/server versions

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = "d:\MyProject\minecraft_mod\behavior_packs\PvZ\manifest.json"
$serverExe = "c:\bedrock-server-1.21.111.1\bedrock_server.exe"
$serverDir = "c:\bedrock-server-1.21.111.1"

# Stop any running server instances first to prevent file locks
Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$testCases = @(
    # Test with 1.26.21 min_engine_version
    @{ engine = @(1, 26, 21); api = "1.19.0" },
    @{ engine = @(1, 26, 21); api = "2.7.0" },
    @{ engine = @(1, 26, 21); api = "2.8.0-beta" },
    @{ engine = @(1, 26, 21); api = "3.0.0-alpha" },
    
    # Test with 1.21.80 min_engine_version
    @{ engine = @(1, 21, 80); api = "1.19.0" },
    @{ engine = @(1, 21, 80); api = "2.7.0" },
    @{ engine = @(1, 21, 80); api = "2.8.0-beta" },
    @{ engine = @(1, 21, 80); api = "3.0.0-alpha" }
)

# Backup manifest.json first
$backupPath = "$manifestPath.bak"
Copy-Item -Path $manifestPath -Destination $backupPath -Force

function Update-Manifest {
    param($engineVerArray, $serverVersion)
    
    $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    # Set min_engine_version
    $json.header.min_engine_version = $engineVerArray
    
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

Write-Host "Starting engine compatibility test..." -ForegroundColor Cyan

$foundMatch = $false
$workingEngine = $null
$workingApi = ""

foreach ($case in $testCases) {
    $engineStr = $case.engine -join "."
    $api = $case.api
    
    Write-Host "Testing min_engine_version: $engineStr, @minecraft/server: $api..." -ForegroundColor Yellow
    
    # Ensure any old instances are hard-killed before testing
    Stop-Process -Name "bedrock_server" -Force -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Seconds 1
    
    # 1. Update manifest
    Update-Manifest -engineVerArray $case.engine -serverVersion $api
    
    # 2. Deploy updated packs
    & "d:\MyProject\minecraft_mod\.agent\skills\deploy.ps1" | Out-Null
    
    # 3. Start server redirecting output to a file
    $safeEngine = $engineStr.Replace(".", "_")
    $safeApi = $api.Replace(".", "_")
    $logFile = Join-Path $scriptPath "test_engine_${safeEngine}_${safeApi}.log"
    $errFile = Join-Path $scriptPath "test_engine_err_${safeEngine}_${safeApi}.log"
    if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }
    
    # Start server process
    $p = Start-Process -FilePath $serverExe -WorkingDirectory $serverDir -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errFile -PassThru
    
    # Wait 4 seconds
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
    
    # 4. Check results
    if ($consoleOutput -match "unrecognized" -or $consoleOutput -match "failed to load" -or $consoleOutput -match "ReferenceError" -or $consoleOutput -match "failed to create context" -or $consoleOutput -match "invalid version" -or $consoleOutput -match "version conflict" -or $consoleOutput -match "run failed" -or -not $consoleOutput) {
        Write-Host "  -> Result: FAILED" -ForegroundColor Red
        $consoleOutput -split "`n" | Where-Object { $_ -match "ERROR" -or $_ -match "WARN" -or $_ -match "unrecognized" -or $_ -match "invalid version" } | ForEach-Object {
            Write-Host "     $_" -ForegroundColor DarkYellow
        }
    } else {
        if ($consoleOutput -match "Server started." -and $consoleOutput -match "PvZ") {
            Write-Host "  -> Result: SUCCESS!" -ForegroundColor Green
            $foundMatch = $true
            $workingEngine = $case.engine
            $workingApi = $api
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
    Write-Host " SUCCESSFUL CONFIGURATION FOUND:" -ForegroundColor Green
    Write-Host " min_engine_version: $($workingEngine -join '.') " -ForegroundColor Green
    Write-Host " @minecraft/server: $workingApi" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    
    # Save the working versions to the manifest
    Update-Manifest -engineVerArray $workingEngine -serverVersion $workingApi
    # Redeploy
    & "d:\MyProject\minecraft_mod\deployment\local\deploy.ps1" | Out-Null
}

if (Test-Path $backupPath) { Remove-Item $backupPath -Force }
