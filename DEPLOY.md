# BibleStudyPro — Backend Deployment Guide

**Server:** Hetzner CX23 · Ubuntu 22.04 · Helsinki  
**Stack:** Node.js 22 + PostgreSQL 16 + PM2 + Caddy  
**App port:** 3001 (internal) → port 80 via Caddy

---

## Step 1 — SSH into the server as root

```bash
ssh root@<SERVER_IP>
```

---

## Step 2 — Run the server init script (once, as root)

Upload and run `backend/scripts/server-init.sh`:

```bash
# From your Mac:
scp backend/scripts/server-init.sh root@<SERVER_IP>:/root/
ssh root@<SERVER_IP> "bash /root/server-init.sh"
```

This installs Node.js 22, PostgreSQL 16, Caddy, PM2, creates the `deploy` user, and sets up the DB.

---

## Step 3 — SSH in as deploy user

```bash
ssh deploy@<SERVER_IP>
```

---

## Step 4 — Clone the repo

```bash
git clone https://github.com/Ramani888/BibleStudy.git /home/deploy/app
cd /home/deploy/app/backend
```

---

## Step 5 — Create the .env file

```bash
nano /home/deploy/app/backend/.env
```

Paste and fill in all values:

```env
DATABASE_URL=postgresql://biblestudypro:CHOOSE_A_STRONG_PASSWORD@localhost:5432/biblestudypro

JWT_ACCESS_SECRET=   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=  # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

ANTHROPIC_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

NODE_ENV=production
PORT=3001
CLIENT_URL=http://<SERVER_IP>
```

> **Important:** Use the same password for `DATABASE_URL` that you set during `server-init.sh` for the `biblestudypro` PostgreSQL user.

---

## Step 6 — Build, migrate and start

```bash
cd /home/deploy/app/backend
npm ci --omit=dev
npm run build
npx prisma migrate deploy
pm2 start ecosystem.config.js
pm2 save
```

---

## Step 7 — Configure Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace contents with:

```
:80 {
    reverse_proxy localhost:3001
}
```

Then reload:

```bash
sudo systemctl reload caddy
```

---

## Step 8 — Verify

```bash
# Check PM2 is running
pm2 status

# Check app logs
pm2 logs biblestudypro-api --lines 50

# Test the API
curl http://<SERVER_IP>/api/v1/health
```

---

## Updating the server (after new commits)

```bash
ssh deploy@<SERVER_IP>
cd /home/deploy/app
git pull
cd backend
npm ci --omit=dev
npm run build
npx prisma migrate deploy
pm2 reload biblestudypro-api
```

---

## Useful commands

```bash
pm2 status                          # process status
pm2 logs biblestudypro-api          # live logs
pm2 restart biblestudypro-api       # restart app
sudo systemctl status caddy         # caddy status
sudo -u postgres psql               # postgres shell
```
