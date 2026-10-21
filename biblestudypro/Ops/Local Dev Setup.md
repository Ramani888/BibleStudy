---
tags: [ops, dev]
---

# Local Dev Setup

Development runs against the **local DB** (Postgres on 5434) — that part is unchanged.
The [[Deployment (Hetzner)|Hetzner VPS]] is **live**, not stopped: verified 2026-10-21,
`pm2` shows `biblestudypro-api` online ~31 days at `94.130.176.8` (plus a `mindrest-api`
beside it). The earlier "stopped to save cost" note from 2026-08-04 is wrong — the server
came back up and prod keeps running while you dev locally.

Since **2026-10-21** the main machine is the **Windows PC** (see [[Moving to Windows PC]]).
Commands below are Windows unless marked *(Mac)*; the Mac is still needed for **iOS only**.
Shell: PowerShell for npm/npx, **Git Bash** for `ssh`/`scp` deploys.

## Database

Postgres 16 on port **5434**, role + database both named `biblestudypro`
(password matches `backend/.env`, which points `DATABASE_URL` at `localhost:5434`).

**The schema needs the `pgvector` extension** — `Card.embedding` and `Note.embedding`
are `vector` columns, added by migration `20260810_add_embeddings`. That migration has
its `CREATE EXTENSION` line commented out, so the extension must already exist or
`prisma migrate deploy` dies with `type "vector" does not exist`.

### Windows (current) — Docker image, because of pgvector
EDB's Windows installer ships no pgvector, and building it from source needs MSVC
Build Tools (~2 GB). The `pgvector/pgvector:pg16` image has it baked in, so the dev DB
is a container:

```bash
docker run -d --name bsp-db --restart unless-stopped -p 5434:5432 \
  -e POSTGRES_USER=biblestudypro -e POSTGRES_PASSWORD=<same as backend/.env> \
  -e POSTGRES_DB=biblestudypro \
  -v bsp-pgdata:/var/lib/postgresql/data pgvector/pgvector:pg16
docker exec bsp-db psql -U biblestudypro -d biblestudypro -c "CREATE EXTENSION IF NOT EXISTS vector;"
```
- Data lives in the named volume **`bsp-pgdata`** — survives container recreation.
  `docker rm bsp-db` is safe; `docker volume rm bsp-pgdata` wipes the dev DB.
- **Docker Desktop must be running before `npm run dev`.** The container auto-starts
  with Docker (`--restart unless-stopped`), so it's one launch, not two.
- psql without entering the container: `docker exec bsp-db psql -U biblestudypro -d biblestudypro`

> A native PostgreSQL 16 is also installed at `C:\Program Files\PostgreSQL\16`
> (CLI tools in `…\16\bin`), but its service `postgresql-x64-16` is **Stopped** and set
> to **Manual** start so it can't take port 5434 from the container. Nothing uses it —
> safe to uninstall. If you ever switch back to it, pgvector has to be solved first.

### *(Mac)* Homebrew
Homebrew `postgresql@16`, data dir `/opt/homebrew/var/postgresql@16`, pgvector via
`brew install pgvector` then `CREATE EXTENSION vector;` in the `biblestudypro` DB.

## Run the backend
```bash
cd backend && npm run dev        # local DB on 5434
```
- `npm run dev` → plain dev server (used now, local DB).
- `npm run dev:remote` → opens an SSH tunnel on **5433** to the remote DB, then
  starts the server (`.env` must point at 5433). Hits the **live prod DB** — only for
  debugging real data, never for schema work.
- `npm run tunnel` → just the SSH tunnel.

## First-time bring-up on a fresh machine
```bash
cd backend  && npm install
cd frontend && npm install
# bring up the DB container first (see Database above), then:
cd backend
npx prisma migrate deploy   # 37 migrations, zero column drift
npx prisma generate
```
Verified on the Windows PC 2026-10-21: 37 applied, 0 failed, `/health` → 200 and
`/api/v1/waitlist/count` → `{"count":0}`.

> Until `20261021000000_reconcile_fsrs_streak_columns` landed, a DB built from
> migrations alone was **missing** the FSRS columns and `User.streakFreezes`
> (added via `db push`), and `/auth/register` died with
> `The column User.streakFreezes does not exist`. The workaround then was
> `prisma db push`; it is no longer needed — `migrate deploy` is now sufficient.

⚠️ **`npx prisma migrate status` output is mangled by the rtk hook** — it prints
"0 applied, 0 pending" even on a fully migrated DB. Trust the DB instead:
```bash
docker exec bsp-db psql -U biblestudypro -d biblestudypro \
  -tAc "select count(*) from _prisma_migrations where rolled_back_at is null"
```

## Checking for schema drift (`migrate diff`)

Drift = `schema.prisma` has something no migration creates, usually because it was
applied with `prisma db push`. It is invisible locally (your DB was pushed to) and
only bites on a rebuild. This has happened **twice** — referral + `StreakFreezeLog`
(fixed by `20260917000000_reconcile_base_schema`) and the FSRS + streak-freeze
columns (`20261021000000_reconcile_fsrs_streak_columns`). Check after any `db push`.

Derive the drift mechanically instead of eyeballing the schema:
```bash
cd backend
./node_modules/.bin/prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "postgresql://biblestudypro:<pw>@localhost:5434/shadow_drift" \
  --script
```

### The pgvector catch
This fails with `type "vector" does not exist` on `20260810_add_embeddings`, even
after `CREATE EXTENSION vector` in the shadow DB — **Prisma resets the shadow database
by dropping schema `public`, which drops the extension with it.** Install the extension
into a schema that survives the reset and put it on the DB's search path:
```sql
CREATE DATABASE shadow_drift;
\c shadow_drift
CREATE SCHEMA ext;
CREATE EXTENSION vector SCHEMA ext;
ALTER DATABASE shadow_drift SET search_path = public, ext;
```
Then the diff runs clean. Drop the scratch DB afterwards.

### Reading the output
Two `DROP INDEX` lines for `card_embedding_idx` / `note_embedding_idx` always appear.
They are **not** drift — they are the raw-SQL HNSW indexes from
`20260810_add_embeddings` that Prisma cannot model, and dropping them would silently
degrade semantic search. Ignore them; everything else is real drift.

### Writing the fix
Follow the two reconcile migrations: every statement `ADD COLUMN IF NOT EXISTS`, with
defaults copied exactly from `schema.prisma`. Prod and existing dev DBs already have
the columns from the `db push`, so the migration must be a **no-op** there and a real
create on a rebuild. Verify on a scratch DB before committing: `migrate deploy` onto an
empty database, re-run `migrate diff` (expect only the two index lines), then apply the
file a second time and confirm it only emits `NOTICE ... skipping`.

If the role/schema is missing on a **native** install, create the `biblestudypro` role
and grant it ownership of the `public` schema (Postgres 15+ restricts `CREATE` on
`public`). The Docker image creates role + database from its env vars, so this only
bites the native path.

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
| 5434 | local Postgres — dev DB; on Windows this is the `bsp-db` container (`5434→5432`) |
| 5433 | SSH tunnel to remote Hetzner DB (only when tunnel open) |
| 3010 | backend API (`PORT` in `.env`) |
| 8081 | Metro bundler (device resolves the API host from this) |

## See also
- [[Moving to Windows PC]] · [[Migration History]] · [[Deployment (Hetzner)]] · [[Database Schema]]
