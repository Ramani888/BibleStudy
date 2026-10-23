#!/usr/bin/env bash
# Deploy backend code (dist/) to prod (94.130.176.8), auto-rollback if health fails.
# Build first:  cd backend && npx tsc   (npm run build also runs prisma generate, which fails
# while the local dev server holds the Prisma engine). No DB/schema step — add one when a
# migration ships.
set -e
SERVER=root@94.130.176.8
cd /c/Users/raman/BibleStudy/backend

echo "== upload"
tar -czf /tmp/dist.tgz dist
scp -q /tmp/dist.tgz "$SERVER":/tmp/

ssh "$SERVER" 'bash -s' <<'EOF'
set -e
cd /home/deploy/app/backend

echo "== swap dist + restart"
rm -rf dist.new dist.old && mkdir dist.new && tar -xzf /tmp/dist.tgz -C dist.new --strip-components=1
mv dist dist.old && mv dist.new dist
pm2 restart biblestudypro-api >/dev/null
sleep 6

H=$(curl -s -o /dev/null -w "%{http_code}" localhost:3001/health)
A=$(curl -s -o /dev/null -w "%{http_code}" localhost:3001/api/v1/auth/me)
echo "health=$H authMe=$A   (want 200 / 401)"

if [ "$H" != "200" ] || [ "$A" = "404" ]; then
  echo "!! ROLLBACK"
  rm -rf dist && mv dist.old dist
  pm2 restart biblestudypro-api >/dev/null; sleep 5
  curl -s -o /dev/null -w "after rollback health=%{http_code}\n" localhost:3001/health
  exit 1
fi
echo "== DONE — deploy OK"
pm2 logs biblestudypro-api --lines 8 --nostream 2>&1 | tail -8
EOF
