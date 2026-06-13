# Script proxy to forward local client deployment to deployment/local/deploy_client.ps1
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path # .agent\skills
$rootPath = Split-Path -Parent (Split-Path -Parent $scriptPath) # workspace root
$targetScript = Join-Path $rootPath "deployment\local\deploy_client.ps1"

if (Test-Path $targetScript) {
    & $targetScript @args
} else {
    Write-Error "Could not find client deployment script at $targetScript"
    exit 1
}
