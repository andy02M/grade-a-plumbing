$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\andys\OneDrive\Documents\New project 2"
$nodePath = "C:\Program Files\nodejs\node.exe"
$workerScript = Join-Path $projectRoot "scripts\browser-worker.mjs"
$logPath = Join-Path $projectRoot ".gmb-browser-state\worker-task.log"

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null
"[$(Get-Date -Format o)] starting browser worker" | Add-Content -LiteralPath $logPath
& $nodePath $workerScript *> $logPath
$exitCode = $LASTEXITCODE
"[$(Get-Date -Format o)] browser worker exited $exitCode" | Add-Content -LiteralPath $logPath
exit $exitCode
