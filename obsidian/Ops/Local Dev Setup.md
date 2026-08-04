---
tags: [ops, dev]
---

# Local Dev Setup

As of **2026-08-04**, development is **local-only** — the [[Deployment (Hetzner)|Hetzner VPS]]
is stopped to save cost.

## Database
- **Homebrew PostgreSQL 16** on port **5434** (data dir `/opt/homebrew/var/postgresql@16`).
- Role + database both named `biblestudypro` (password matches `backend/.env`;
  role/schema owned by `biblestudypro`).
- `backend/.env` `DATABASE_URL` points at `localhost:5434`.

## Run the backend
```bash
cd backend && npm run dev        # local DB on 5434
```
- `npm run dev` → plain dev server (used now, local DB).
- `npm run dev:remote` → opens an SSH tunnel on **5433** to the remote DB, then
  starts the server (used when Hetzner is up; `.env` must point at 5433).
- `npm run tunnel` → just the SSH tunnel.

## First-time DB bring-up
```bash
cd backend
npx prisma migrate deploy   # applies all migrations (clean, zero drift)
npx prisma generate
```
If the local role/schema is missing, create the `biblestudypro` role and grant it
ownership of the `public` schema (Postgres 15+ restricts `CREATE` on `public`).

## Run the app
```bash
cd frontend && npx react-native start          # Metro
cd frontend && npx react-native run-ios        # or run-android
cd frontend && npx tsc --noEmit                # type check
```

## Running on a physical iOS device

The app's dev API base URL (`frontend/src/api/client.ts`) resolves its host from
**Metro's bundler URL** (`NativeModules.SourceCode.scriptURL`), so it works on a
physical iPhone without hardcoding an IP:
- Simulator / Android (`adb reverse`) → `localhost:3010`.
- Physical device → the Mac's LAN IP (e.g. `192.168.1.2:3010`) automatically.

Requirements:
- iPhone and Mac on the **same Wi-Fi** (private, not guest/client-isolated).
- Backend running (`npm run dev`) and reachable at `http://<mac-lan-ip>:3010/health`.
- iOS ATS already allows local HTTP (`NSAllowsLocalNetworking=true` in Info.plist).
- After the change, **reload JS** on the device (no native rebuild needed).
- If auth still fails: check macOS firewall isn't blocking `node`, and accept the
  one-time "find devices on your local network" prompt.

Historical bug: dev base URL was hardcoded to `localhost:3010` (an Android
`adb reverse` assumption) → physical iPhone hit *itself* → network error on auth.

## Ports cheat-sheet
| Port | What |
|------|------|
| 5434 | local Postgres (current dev DB) |
| 5433 | SSH tunnel to remote Hetzner DB (only when tunnel open) |
| 3010 | backend API (`PORT` in `.env`) |
| 8081 | Metro bundler (device resolves the API host from this) |

## See also
- [[Migration History]] · [[Deployment (Hetzner)]] · [[Database Schema]]
