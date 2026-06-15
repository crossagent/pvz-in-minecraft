# Automated CLI GameTest runner for Minecraft PvZ Behavior Pack.

$ErrorActionPreference = "Stop"

function Test-GameTestPass {
    param ([string]$Line)

    return $Line -match "\[PvZ Test Runner\]\s+PvZTests:sanity_check PASSED" `
        -or $Line -match "\bPvZTests:sanity_check\b.*\bPASSED\b" `
        -or $Line -match "\bsanity_check' PASSED\b"
}

function Test-GameTestFailure {
    param ([string]$Line)

    $runnerFailure = $Line -match "\[PvZ Test Runner\].*(PvZTests:sanity_check FAILED|GAME_TEST_COMMAND_FAILED|WORLD_LOAD_SUBSCRIBE_FAILED)"
    $gameTestFailure = $Line -notmatch "\[PvZ Test Runner\]" `
        -and $Line -match "(?i)\b(GameTest|PvZTests|sanity_check)\b.*\bfailed\b"

    return $runnerFailure -or $gameTestFailure
}

function Stop-ServerProcess {
    param (
        [System.Diagnostics.Process]$Process,
        [string]$Reason
    )

    if ($Process.HasExited) {
        return
    }

    Write-Host "$Reason Force-stopping BDS process..." -ForegroundColor Yellow
    Stop-Process -Id $Process.Id -Force
    try {
        Wait-Process -Id $Process.Id -Timeout 5
    } catch {
        Write-Warning "BDS process did not confirm exit within 5 seconds."
    }
}

function Enable-GameTestInDeployedPack {
    param ([string]$serverPath)

    $deployedPackPath = Join-Path $serverPath "development_behavior_packs/PvZ"
    $manifestPath = Join-Path $deployedPackPath "manifest.json"
    $mainScriptPath = Join-Path $deployedPackPath "scripts/main.js"
    $testImport = 'import "./tests/GameTestRunner.js";'

    if (-not (Test-Path $manifestPath)) {
        throw "Deployed PvZ manifest not found at $manifestPath"
    }
    if (-not (Test-Path $mainScriptPath)) {
        throw "Deployed PvZ main script not found at $mainScriptPath"
    }

    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $dependencies = @($manifest.dependencies)
    $hasGameTestDependency = $false
    foreach ($dependency in $dependencies) {
        if ($dependency.module_name -eq "@minecraft/server-gametest") {
            $hasGameTestDependency = $true
            $dependency.version = "1.0.0-beta"
            break
        }
    }

    if (-not $hasGameTestDependency) {
        $dependencies += [PSCustomObject]@{
            module_name = "@minecraft/server-gametest"
            version = "1.0.0-beta"
        }
        $manifest.dependencies = $dependencies
        $manifest | ConvertTo-Json -Depth 20 | Out-File -FilePath $manifestPath -Encoding utf8
    }

    $mainScript = Get-Content $mainScriptPath -Raw
    if ($mainScript -notmatch [regex]::Escape($testImport)) {
        $mainScript = $mainScript -replace '(?m)(^import .+;\r?\n)(?!import )', "`$1$testImport`r`n"
        $mainScript | Out-File -FilePath $mainScriptPath -Encoding utf8
    }

    Write-Host "Enabled GameTest runner in deployed BDS behavior pack." -ForegroundColor Green
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path # tests/
$rootPath = Split-Path -Parent $scriptPath                    # workspace root
$envFile = Join-Path $rootPath ".env"

# 1. Load environment configurations
$serverPath = ""
if (Test-Path $envFile) {
    $env = @{}
    Get-Content $envFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        $env[$key] = $val
    }
    $serverPath = $env["MINECRAFT_SERVER_PATH"]
}

if (-not $serverPath) {
    $serverPath = Join-Path $rootPath "bedrock-server"
}

if (-not (Test-Path $serverPath)) {
    Write-Error "Dedicated Server directory not found at $serverPath"
    exit 1
}

Write-Host "Deploying latest scripts and behavior pack to server..." -ForegroundColor Yellow
$deployScript = Join-Path $rootPath "deployment/local/deploy.ps1"
$deployOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $deployScript
$deployExitCode = $LASTEXITCODE
$deployOutput | ForEach-Object { Write-Host $_ }
if ($deployExitCode -ne 0) {
    Write-Error "Server deployment failed."
    exit 1
}
Enable-GameTestInDeployedPack -serverPath $serverPath

# Define log files
$logPath = Join-Path $scriptPath "server_stdout.log"
$errPath = Join-Path $scriptPath "server_stderr.log"

# Clean up previous log files
if (Test-Path $logPath) { Remove-Item $logPath -Force }
if (Test-Path $errPath) { Remove-Item $errPath -Force }

Write-Host "Starting Minecraft Dedicated Server in headless GameTest mode..." -ForegroundColor Yellow
$serverExe = Join-Path $serverPath "bedrock_server.exe"

$process = Start-Process `
    -FilePath $serverExe `
    -WorkingDirectory $serverPath `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput $logPath `
    -RedirectStandardError $errPath

$timeoutSec = 35
$deadline = (Get-Date).AddSeconds($timeoutSec)
$detectedResult = $null

Write-Host "Waiting for GameTests to run (Timeout: ${timeoutSec}s)..." -ForegroundColor Yellow

while ((Get-Date) -lt $deadline) {
    if ($process.HasExited) {
        break
    }

    if (Test-Path $logPath) {
        $liveLogContent = @(Get-Content $logPath -ErrorAction SilentlyContinue)
        if ($liveLogContent | Where-Object { Test-GameTestFailure $_ } | Select-Object -First 1) {
            $detectedResult = "failed"
            break
        }
        if ($liveLogContent | Where-Object { Test-GameTestPass $_ } | Select-Object -First 1) {
            $detectedResult = "passed"
            break
        }
    }

    Start-Sleep -Milliseconds 500
}

if ($detectedResult -eq "passed") {
    Start-Sleep -Seconds 2
    Stop-ServerProcess -Process $process -Reason "GameTest pass signal detected."
} elseif ($detectedResult -eq "failed") {
    Start-Sleep -Seconds 1
    Stop-ServerProcess -Process $process -Reason "GameTest failure signal detected."
} elseif (-not $process.HasExited) {
    Write-Warning "Server test run timed out after ${timeoutSec} seconds."
    Stop-ServerProcess -Process $process -Reason "Timeout reached."
}

# 2. Analyze Logs for Failures/Successes
if (-not (Test-Path $logPath)) {
    Write-Error "Server stdout log file not found at $logPath"
    exit 1
}

$logContent = @(Get-Content $logPath)
$scriptErrors = $logContent | Where-Object {
    $_ -match "\[Scripting\]\s*\[error\]" `
        -or $_ -match "\b(TypeError|ReferenceError|SyntaxError)\b"
}
$testSuccess = $logContent | Where-Object { Test-GameTestPass $_ }
$testFailed = $logContent | Where-Object { Test-GameTestFailure $_ }

Write-Host "`n=================== Test Execution Log Summary ===================" -ForegroundColor Cyan
$logContent | Select-Object -Last 40 | ForEach-Object { Write-Host $_ }
Write-Host "==================================================================`n" -ForegroundColor Cyan

$success = $true

if ($scriptErrors) {
    Write-Host "Scripting runtime errors detected during open/load phase." -ForegroundColor Red
    $scriptErrors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    $success = $false
}

if ($testFailed) {
    Write-Host "GameTest failures detected." -ForegroundColor Red
    $testFailed | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    $success = $false
}

if (-not $testSuccess -and $success) {
    Write-Host "Sanity check GameTest did not execute or output results." -ForegroundColor Red
    $success = $false
}

if ($success) {
    Write-Host "CLI GameTest sanity check passed successfully." -ForegroundColor Green
    if (Test-Path $logPath) { Remove-Item $logPath -Force }
    if (Test-Path $errPath) { Remove-Item $errPath -Force }
    exit 0
}

Write-Host "CLI GameTest failed." -ForegroundColor Red
exit 1
