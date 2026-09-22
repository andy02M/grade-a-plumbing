$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

$env:GMB_POST_DATE = "2026-09-13"
$env:GMB_BROWSER_KEEP_OPEN = "true"
$env:GMB_BROWSER_PAUSE_ON_DRY_RUN = "true"
$env:GMB_BROWSER_CHANNEL = if ($env:GMB_BROWSER_CHANNEL) { $env:GMB_BROWSER_CHANNEL } else { "msedge" }

npm run gmb:browser-post
