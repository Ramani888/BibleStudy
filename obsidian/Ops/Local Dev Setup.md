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

## Ports cheat-sheet
| Port | What |
|------|------|
| 5434 | local Postgres (current dev DB) |
| 5433 | SSH tunnel to remote Hetzner DB (only when tunnel open) |
| 3010 | backend API (`PORT` in `.env`) |

## See also
- [[Migration History]] · [[Deployment (Hetzner)]] · [[Database Schema]]
