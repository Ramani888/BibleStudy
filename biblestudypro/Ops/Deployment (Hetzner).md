---
tags: [ops, deployment]
---

# Deployment (Hetzner)

> ⚠️ **STATUS 2026-08-04: server STOPPED / deleted** to save cost (~€46 last
> month). A fresh server will be provisioned when the project is ready to ship.
> Consequence: the SSH host key at `46.225.189.44` has changed / the IP may be
> reassigned — do **not** blindly accept a new host key.

## Original setup (for when it's recreated)
- **Server:** Hetzner CX23 (2 vCPU / 4 GB / 40 GB SSD), Ubuntu 22.04, nbg1.
- **IP:** 46.225.189.44 · SSH as `deploy` (root login disabled).
- **Stack on VPS:** Node 22, PM2 (process manager), PostgreSQL 16 (local),
  Caddy 2.11 (reverse proxy → localhost:3001).
- **Firewall:** Hetzner FW + UFW (ports 22, 80).
- **Object storage:** Hetzner Object Storage (S3) for [[Module - Media & Notes|media]].

## Deploy loop (historical)
SSH as `deploy@46.225.189.44` → pull → rebuild → `pm2 reload`.

## Phases
- Phase 1: HTTP-only via raw IP (dev/testing).
- Phase 2 (pending): buy domain, Caddy auto-SSL, port 443 — needed for store submission.

## When recreating the server
1. Provision, install Node/PM2/Postgres/Caddy.
2. Restore/create the DB; run `npx prisma migrate deploy` (clean — see
   [[Migration History]]). If the remote DB was ever managed by `prisma db push`,
   **baseline** these migrations with `prisma migrate resolve --applied <name>`
   instead of re-running them.
3. Point `backend/.env` `DATABASE_URL` back to the tunnel port **5433** and use
   `npm run dev:remote` for local work against it.
4. Update `~/.ssh/known_hosts` with the new host key (verify via Hetzner console).

## See also
- [[Local Dev Setup]] — the current local-only workflow
