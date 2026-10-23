#!/usr/bin/env bash
# Deploy backend to prod (94.130.176.8): Report table + new dist, auto-rollback on failure.
set -e
SERVER=root@94.130.176.8
cd /c/Users/raman/BibleStudy/backend

echo "== upload"
tar -czf /tmp/dist.tgz dist
scp -q /tmp/dist.tgz prisma/schema.prisma prisma/migrations/20261022000000_add_user_reports/migration.sql "$SERVER":/tmp/

ssh "$SERVER" 'bash -s' <<'EOF'
set -e
cd /home/deploy/app/backend
set -a; . ./.env 2>/dev/null || true; set +a

echo "== 1. Report table"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -q -f /tmp/migration.sql && echo table-ok

echo "== 2. prisma client"
cp prisma/schema.prisma prisma/schema.prisma.bak-20261023
cp /tmp/schema.prisma prisma/schema.prisma
npx prisma generate >/dev/null 2>&1 && echo generate-ok

echo "== 3. swap dist + restart"
rm -rf dist.new dist.old && mkdir dist.new && tar -xzf /tmp/dist.tgz -C dist.new --strip-components=1
mv dist dist.old && mv dist.new dist
pm2 restart biblestudypro-api >/dev/null
sleep 6

H=$(curl -s -o /dev/null -w "%{http_code}" localhost:3001/health)
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3001/api/v1/reports)
Q=$(curl -s -o /dev/null -w "%{http_code}" localhost:3001/api/v1/quiz/attempts/count)
echo "health=$H reports=$R quizCount=$Q   (want 200 / 401 / 401)"

if [ "$H" != "200" ] || [ "$Q" = "404" ] || [ "$R" = "404" ]; then
  echo "!! ROLLBACK"
  rm -rf dist && mv dist.old dist
  cp prisma/schema.prisma.bak-20261023 prisma/schema.prisma && npx prisma generate >/dev/null 2>&1
  pm2 restart biblestudypro-api >/dev/null; sleep 5
  curl -s -o /dev/null -w "after rollback health=%{http_code}\n" localhost:3001/health
  exit 1
fi
echo "== DONE — deploy OK"
pm2 logs biblestudypro-api --lines 8 --nostream 2>&1 | tail -8
EOF
