$exePath = "d:\MyProject\minecraft_mod\bedrock-server\bedrock_server.exe"
if (-not (Test-Path $exePath)) {
    Write-Error "Server exe not found at $exePath"
    exit 1
}

Write-Host "Reading server binary to discover supported scripting API versions..." -ForegroundColor Cyan

# Read binary bytes
$bytes = [System.IO.File]::ReadAllBytes($exePath)
$text = [System.Text.Encoding]::ASCII.GetString($bytes)

# Regex search for modules
$matches = [regex]::Matches($text, '@minecraft/server[\w/\-\.\x22\x2C\x3A]*')
$uniqueMatches = $matches | Select-Object -ExpandProperty Value -Unique | Sort-Object

foreach ($m in $uniqueMatches) {
    Write-Host "Found module pattern: $m" -ForegroundColor Green
}
