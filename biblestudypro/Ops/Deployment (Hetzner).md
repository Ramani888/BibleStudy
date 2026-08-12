---
tags: [ops, deployment]
---

# Deployment (Hetzner)

> ✅ **STATUS 2026-08-12: LIVE** — new server provisioned on new Hetzner account.
> Old server (`46.225.189.44`) and old account are **permanently closed**.

## Current server
- **Server:** Hetzner CX23 (2 vCPU / 4 GB / 40 GB SSD), Ubuntu 22.04, nbg1
- **IP:** `94.130.176.8` · SSH as `root@94.130.176.8` (or `deploy@` if deploy user created)
- **Server ID:** 161773426
- **Stack:** Node.js 22, PM2, PostgreSQL 16, Caddy 2.x
- **Firewall:** ports 22, 80, 443, ICMP
- **Media storage:** Server local disk (40 GB SSD) — no Object Storage on new account

## Deploy loop
SSH as `root@94.130.176.8` → pull → rebuild → `pm2 reload`

## Phases
- Phase 1 (current): HTTP-only via raw IP (dev/testing)
- Phase 2 (pending): buy domain → update Caddyfile → Caddy auto-SSL → port 443 (needed for store submission)

## See also
- [[Local Dev Setup]] — local development workflow
