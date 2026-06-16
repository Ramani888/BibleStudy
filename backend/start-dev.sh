#!/usr/bin/env bash
# Opens SSH tunnel to Hetzner VPS, then launches the dev server.
set -euo pipefail

VPS_IP="46.225.189.44"
VPS_USER="deploy"
LOCAL_PORT=5433
REMOTE_PORT=5432
TUNNEL_PID=""

cleanup() {
  if [ -n "$TUNNEL_PID" ] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "[tunnel] Closing SSH tunnel (PID $TUNNEL_PID)..."
    kill "$TUNNEL_PID"
  fi
}
trap cleanup EXIT INT TERM

if lsof -iTCP:${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "[tunnel] Port ${LOCAL_PORT} already open — reusing existing tunnel."
else
  echo "[tunnel] Opening SSH tunnel ${LOCAL_PORT} -> ${VPS_USER}@${VPS_IP}:${REMOTE_PORT} ..."
  ssh -o StrictHostKeyChecking=accept-new \
      -L "${LOCAL_PORT}:localhost:${REMOTE_PORT}" \
      "${VPS_USER}@${VPS_IP}" -N &
  TUNNEL_PID=$!

  for i in $(seq 1 10); do
    sleep 1
    if lsof -iTCP:${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "[tunnel] Ready after ${i}s."
      break
    fi
    if [ "$i" -eq 10 ]; then
      echo "[tunnel] ERROR: tunnel did not open after 10s. Check SSH key / VPS reachability."
      exit 1
    fi
  done
fi

echo "[backend] Starting dev server..."
npm run dev
