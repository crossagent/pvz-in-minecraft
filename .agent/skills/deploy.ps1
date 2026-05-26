# Script proxy to forward deployment to deployment/local/deploy.ps1
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path # .agent\skills
$rootPath = Split-Path -Parent (Split-Path -Parent $scriptPath) # workspace root
$targetScript = Join-Path $rootPath "deployment\local\deploy.ps1"

if (Test-Path $targetScript) {
    & $targetScript @args
} else {
    Write-Error "Could not find deployment script at $targetScript"
    exit 1
}
