# Deploy — Manual Backend Deployment

Deploy the backend to the Hetzner VPS at `94.130.176.8`.

## Trigger
User says: "deploy", "push to server", "deploy backend", `/deploy`

## Steps

### 1. Rsync code
```bash
rsync -az --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' \
  /Volumes/DevSSD/Work/BibleStudy/backend/ \
  deploy@94.130.176.8:/home/deploy/app/backend/ \
  -e "ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no"
```

### 2. Run any new migrations (if schema.prisma changed)
```bash
ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no deploy@94.130.176.8 \
  "cd ~/app/backend && npx prisma migrate deploy 2>&1"
```

### 3. Reload PM2
```bash
ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no deploy@94.130.176.8 \
  "pm2 reload biblestudypro 2>&1"
```

### 4. Health check — show status of all services

After reload, use `ctx_execute` (language: javascript) to check all three services and print a summary table:

```javascript
const http = require('http');
const { execSync } = require('child_process');

// 1. API health
const api = await new Promise(resolve => {
  http.get('http://94.130.176.8/health', res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
  }).on('error', e => resolve({ status: 'ERR', body: e.message }));
});

// 2. PM2 status
const pm2 = execSync(`ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no deploy@94.130.176.8 "pm2 jlist 2>/dev/null"`).toString();
const procs = JSON.parse(pm2).map(p => ({ name: p.name, status: p.pm2_env.status, uptime: p.pm2_env.pm_uptime, restarts: p.pm2_env.restart_time, mem: Math.round(p.monit.memory / 1024 / 1024) + 'MB' }));

// 3. Services (postgres + caddy)
const services = execSync(`ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no root@94.130.176.8 "systemctl is-active postgresql caddy 2>&1"`).toString().trim().split('\n');

console.log('=== Deploy Health ===');
console.log(`API       : ${api.status === 200 ? '✅ ' + api.body.message : '❌ ' + api.status}`);
procs.forEach(p => console.log(`PM2 [${p.name}]: ${p.status === 'online' ? '✅' : '❌'} ${p.status} | restarts: ${p.restarts} | mem: ${p.mem}`));
console.log(`PostgreSQL: ${services[0] === 'active' ? '✅ active' : '❌ ' + services[0]}`);
console.log(`Caddy     : ${services[1] === 'active' ? '✅ active' : '❌ ' + services[1]}`);
```

## Notes
- Server: Hetzner cx23, IP `94.130.176.8`, user `deploy`
- SSH key: `~/.ssh/id_rsa` (MacBook Air RSA key)
- App runs on port 3001, Caddy proxies 80 → 3001
- PM2 process name: `biblestudypro`
- Skip step 2 if no migrations were added

## On new migration errors
If a migration fails (e.g. missing extension, enum conflict on fresh DB):
1. `npx prisma migrate resolve --rolled-back <migration_name>`
2. Apply the SQL manually via `sudo -u postgres psql -d biblestudypro -f /tmp/fix.sql` (as root)
3. `npx prisma migrate resolve --applied <migration_name>`
4. Re-run `npx prisma migrate deploy`
