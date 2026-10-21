---
tags: [ops, dev]
---

# Local Dev Setup

As of **2026-08-04**, development is **local-only** — the [[Deployment (Hetzner)|Hetzner VPS]]
is stopped to save cost.

Since **2026-10-21** the main machine is the **Windows PC** (see [[Moving to Windows PC]]).
Commands below are Windows unless marked *(Mac)*; the Mac is still needed for **iOS only**.
Shell: PowerShell for npm/npx, **Git Bash** for `ssh`/`scp` deploys.

## Database
- **PostgreSQL 16** on port **5434**.
  - Windows: installer from postgresql.org; CLI tools live in
    `C:\Program Files\PostgreSQL\16\bin` (add to PATH or call `psql.exe` by full path).
  - *(Mac)* Homebrew `postgresql@16`, data dir `/opt/homebrew/var/postgresql@16`.
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

## First-time bring-up on a fresh machine
```bash
cd backend  && npm install
cd frontend && npm install
cd backend
npx prisma migrate deploy   # applies all migrations (clean, zero drift)
npx prisma generate
```
If the local role/schema is missing, create the `biblestudypro` role and grant it
ownership of the `public` schema (Postgres 15+ restricts `CREATE` on `public`).

`.env` files and `credentials/` are **not in git** — copy them by hand first,
see [[Moving to Windows PC]].

## Run the app
```bash
cd frontend && npx react-native start          # Metro
cd frontend && npx react-native run-android    # Windows
cd frontend && npx tsc --noEmit                # type check
```
`run-ios` is **Mac-only** — no iOS build, device run, TestFlight or App Store
upload from the PC.

## Running on a physical Android device (Windows)

Use **`adb reverse`**, not the PC's LAN IP:
```bash
adb reverse tcp:3010 tcp:3010    # backend API
adb reverse tcp:8081 tcp:8081    # Metro (run-android usually sets this)
```
The Wi-Fi adapter is on the **Public** network profile, so Windows Firewall blocks
inbound `node` — a LAN-IP base URL times out. `adb reverse` tunnels over USB and
sidesteps the firewall entirely, so `localhost:3010` works on the device.

Checks when auth fails:
- `adb devices` lists the phone (USB debugging on, authorised).
- Backend up: `http://localhost:3010/health` on the PC.
- Reload JS after changing the base URL (no native rebuild needed).

Alternative if you really want LAN IP: switch the Wi-Fi profile to Private and
allow `node` through the firewall. Not the default path.

## Running on a physical iOS device *(Mac only)*

The app's dev API base URL (`frontend/src/api/client.ts`) is set to the Mac's
**LAN IP** (`http://192.168.1.2:3010/api/v1`) so a physical iPhone can reach the
backend — `localhost` on a real device means the phone itself.

> ⚠️ Hardcoded — **update this line if the Mac's LAN IP changes** (new Wi-Fi /
> router). Check the current IP with `ipconfig getifaddr en0`.

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
- [[Moving to Windows PC]] · [[Migration History]] · [[Deployment (Hetzner)]] · [[Database Schema]]
