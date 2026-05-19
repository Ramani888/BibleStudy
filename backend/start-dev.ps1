# Starts SSH tunnel to Hetzner VPS, then launches the dev server.
# Usage: powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

$VPS_IP      = "46.225.189.44"
$VPS_USER    = "deploy"
$LOCAL_PORT  = 5433
$REMOTE_PORT = 5432

$tunnel = $null

$existing = netstat -an | Select-String "127.0.0.1:$LOCAL_PORT"
if ($existing) {
    Write-Host "[tunnel] Port $LOCAL_PORT already open - reusing existing tunnel." -ForegroundColor Yellow
} else {
    Write-Host "[tunnel] Opening SSH tunnel ${LOCAL_PORT} -> ${VPS_USER}@${VPS_IP}:${REMOTE_PORT} ..." -ForegroundColor Cyan
    $sshArgs = "-o StrictHostKeyChecking=accept-new -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${VPS_USER}@${VPS_IP} -N"
    $tunnel = Start-Process -FilePath "ssh" -ArgumentList $sshArgs -PassThru -WindowStyle Hidden

    $waited = 0
    while ($waited -lt 10) {
        Start-Sleep -Seconds 1
        $waited++
        if (netstat -an | Select-String "127.0.0.1:$LOCAL_PORT") {
            Write-Host "[tunnel] Ready after ${waited}s." -ForegroundColor Green
            break
        }
    }

    if (-not (netstat -an | Select-String "127.0.0.1:$LOCAL_PORT")) {
        Write-Host "[tunnel] ERROR: tunnel did not open after ${waited}s. Check SSH key / VPS reachability." -ForegroundColor Red
        if ($tunnel) { Stop-Process -Id $tunnel.Id -ErrorAction SilentlyContinue }
        exit 1
    }
}

Write-Host "[backend] Starting dev server..." -ForegroundColor Cyan
try {
    npm run dev
} finally {
    if ($tunnel -and -not $tunnel.HasExited) {
        Write-Host "[tunnel] Closing SSH tunnel (PID $($tunnel.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $tunnel.Id -ErrorAction SilentlyContinue
    }
}
