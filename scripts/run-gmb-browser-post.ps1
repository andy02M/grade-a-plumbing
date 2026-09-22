$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

$env:GMB_BROWSER_DRY_RUN = "false"
$env:GMB_BROWSER_LOCATION_NAME = if ($env:GMB_BROWSER_LOCATION_NAME) { $env:GMB_BROWSER_LOCATION_NAME } else { "Grade A Plumbing Melbourne" }
$env:GMB_BROWSER_CHANNEL = if ($env:GMB_BROWSER_CHANNEL) { $env:GMB_BROWSER_CHANNEL } else { "msedge" }

npm run gmb:browser-post
