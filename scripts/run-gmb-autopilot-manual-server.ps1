$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\andys\OneDrive\Documents\New project 2"
$nodePath = "C:\Program Files\nodejs\node.exe"
$serverScript = Join-Path $projectRoot "scripts\browser-worker-manual-server.mjs"
$logPath = Join-Path $projectRoot ".gmb-browser-state\manual-server.log"

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null
"[$(Get-Date -Format o)] starting manual browser server" | Add-Content -LiteralPath $logPath
& $nodePath $serverScript *>> $logPath
$exitCode = $LASTEXITCODE
"[$(Get-Date -Format o)] manual browser server exited $exitCode" | Add-Content -LiteralPath $logPath
exit $exitCode
