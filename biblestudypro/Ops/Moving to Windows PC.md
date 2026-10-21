---
tags: [ops, dev, setup]
---

# Moving to Windows PC

Written **2026-10-21** when work moved from the Mac laptop to the Windows PC.
The repo on GitHub (`git@github.com:Ramani888/BibleStudy.git`) has all the code;
everything below is what git does **not** carry.

## 1. Clone
```bash
git clone git@github.com:Ramani888/BibleStudy.git
```
Needs your SSH key on the PC (copy `~/.ssh/` from the Mac, or add a new key to GitHub).

## 2. Secret files — copy by hand (USB / private drive, never git or chat)
| File | Why |
|------|-----|
| `backend/.env` | DB, JWT, AI keys, RevenueCat, Firebase admin |
| `frontend/.env`, `frontend/.env.ios`, `frontend/.env.production` | app config (dev LAN IP / prod API) |
| `credentials/` | Apple .p8, Google service account, Firebase keys — see [[Identity & Accounts]] |
| `frontend/android/app/biblestudypro-release.keystore` | ⚠️ **signs every Android update — losing it = can't update the Play app. Keep a backup.** |
| `biblestudypro/Ops/Google Credentials.md` | gitignored note |
| `marketing/video/raw/`, `out/` | only if working on promo videos |

After copying, change `frontend/.env` API URL to the **PC's** LAN IP for device testing.

## 3. Tools to install
- Node (same major as Mac), Git (comes with **Git Bash** — use it for `scp`/`ssh` deploys)
- **Docker Desktop** — the dev DB is the `pgvector/pgvector:pg16` container `bsp-db` on port
  **5434**, because the schema needs pgvector and EDB's Windows Postgres doesn't ship it.
  Exact `docker run` + `CREATE EXTENSION` in [[Local Dev Setup]]; then
  `npx prisma migrate deploy && npx prisma generate` in `backend/`
- JDK 17 + Android Studio (SDK, emulator)
- `npm install` in `backend/` and `frontend/`

## 4. Claude Code setup
- **Memory** — copy `~/.claude/projects/-Volumes-DevSSD-Work-BibleStudy/memory/` from the Mac.
  On the PC the project path differs, so: run `claude` once inside the project, then paste the
  memory files into the new folder it creates under `C:\Users\<you>\.claude\projects\`.
- **Global files** — `~/.claude/CLAUDE.md`, `~/.claude/RTK.md`, `~/.claude/settings.json`
  (check hook paths inside settings.json — Mac paths won't work on Windows).
- **Custom skills** — `~/.claude/skills/` (graphify, meditation-icons, meditation-parity,
  mindrest-screen, perf-audit, synced). Some are symlinks — copy the real folders too:
  `~/.agents/skills/` (caveman, handoff, intent-layer) and `~/.claude/vendor/claudex-loop/`.
- **Plugins** (ponytail, context-mode, playwright, …) — reinstall with `/plugin`, don't copy.
- **Project config** — `.claude/` in the repo (agents, skills, settings.json) comes with git.
- **Account things** (login, Gmail/Figma/Canva connectors, redesign canvas artifact) follow the
  claude.ai account automatically.
- `code-review-graph` MCP points to `C:\Users\raman\AppData\Roaming\Python\Python311\Scripts\code-review-graph.exe`
  — make sure it's installed there on the PC.

## 5. What the PC can't do
- **No iOS** — building, iPhone runs, TestFlight/App Store uploads need the Mac.
- Android, backend, website (`legal/`), deploys to Hetzner ([[Deployment (Hetzner)]]) all work on Windows.
