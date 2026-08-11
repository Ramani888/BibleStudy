#!/bin/bash
# Run once as root on a fresh Ubuntu 22.04 Hetzner server.
# Sets up: deploy user, Node.js 22, PostgreSQL 16, Caddy, PM2, log dir, DB.

set -e

echo "==> Reading DB password"
read -rsp "Enter password for PostgreSQL 'biblestudypro' user: " DB_PASS
echo ""

# ── System update ─────────────────────────────────────────────────────────────
echo "==> Updating system"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl gnupg2 ca-certificates lsb-release git ufw

# ── deploy user ───────────────────────────────────────────────────────────────
echo "==> Creating deploy user"
if ! id deploy &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG sudo deploy
  # copy root's authorized_keys so the same SSH key works for deploy user
  mkdir -p /home/deploy/.ssh
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys
  # passwordless sudo for deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
fi

# ── Log directory ─────────────────────────────────────────────────────────────
mkdir -p /home/deploy/logs
chown deploy:deploy /home/deploy/logs

# ── Node.js 22 ────────────────────────────────────────────────────────────────
echo "==> Installing Node.js 22"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v && npm -v

# ── PM2 ───────────────────────────────────────────────────────────────────────
echo "==> Installing PM2"
npm install -g pm2
# setup PM2 to start on boot for deploy user
sudo -u deploy pm2 startup systemd -u deploy --hp /home/deploy | tail -1 | bash

# ── PostgreSQL 16 ─────────────────────────────────────────────────────────────
echo "==> Installing PostgreSQL 16"
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update -y
apt-get install -y postgresql-16

systemctl enable postgresql
systemctl start postgresql

echo "==> Creating PostgreSQL DB and user"
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'biblestudypro') THEN
    CREATE USER biblestudypro WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;
CREATE DATABASE biblestudypro OWNER biblestudypro;
GRANT ALL PRIVILEGES ON DATABASE biblestudypro TO biblestudypro;
SQL

# ── Caddy ─────────────────────────────────────────────────────────────────────
echo "==> Installing Caddy"
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y
apt-get install -y caddy
systemctl enable caddy

# ── UFW firewall ──────────────────────────────────────────────────────────────
echo "==> Configuring UFW"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ Server init complete."
echo "   Next: ssh deploy@<SERVER_IP> and follow DEPLOY.md steps 4-8."
