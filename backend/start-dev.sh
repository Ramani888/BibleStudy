#!/usr/bin/env bash
# Opens SSH tunnel to Hetzner VPS, then launches the dev server.
set -euo pipefail

# ⚠️ This tunnels to the LIVE PROD database. Use it to debug real data only —
# never for schema work. Day-to-day dev runs against the local DB (`npm run dev`).
VPS_IP="94.130.176.8"
VPS_USER="root"
LOCAL_PORT=5433
REMOTE_PORT=5432
TUNNEL_PID=""

# lsof is absent on Windows/Git Bash (the main dev machine since 2026-10-21), where it
# would fail the readiness check even on a healthy tunnel. bash's /dev/tcp works on both.
port_open() { (exec 3<>/dev/tcp/127.0.0.1/"${LOCAL_PORT}") 2>/dev/null; }

cleanup() {
  if [ -n "$TUNNEL_PID" ] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "[tunnel] Closing SSH tunnel (PID $TUNNEL_PID)..."
    kill "$TUNNEL_PID"
  fi
}
trap cleanup EXIT INT TERM

if port_open; then
  echo "[tunnel] Port ${LOCAL_PORT} already open — reusing existing tunnel."
else
  echo "[tunnel] Opening SSH tunnel ${LOCAL_PORT} -> ${VPS_USER}@${VPS_IP}:${REMOTE_PORT} ..."
  ssh -o StrictHostKeyChecking=accept-new \
      -L "${LOCAL_PORT}:localhost:${REMOTE_PORT}" \
      "${VPS_USER}@${VPS_IP}" -N &
  TUNNEL_PID=$!

  for i in $(seq 1 10); do
    sleep 1
    if port_open; then
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
