#!/bin/bash
# Полный деплой на VPS: pull → prisma → build → pm2 → smoke API
set -euo pipefail

APP="${APP_DIR:-/opt/dvizh}"
cd "$APP"

echo "=== Swap ==="
swapon /swapfile 2>/dev/null || true

echo "=== .env ==="
if [ ! -f .env ]; then
  cat > .env << 'ENV'
DATABASE_URL=postgresql://dvizh:dvizh_test_2026@localhost:5432/dvizh?schema=public
JWT_SECRET=prod-dvizh-demo-secret-change-me
NODE_ENV=production
COOKIE_SECURE=true
SITE_URL=https://www.flroal.ru
NEXT_PUBLIC_SITE_URL=https://www.flroal.ru
UPLOADS_DIR=/opt/dvizh/data/uploads
ENV
fi

mkdir -p /opt/dvizh/data/uploads/avatars /opt/dvizh/data/uploads/covers /opt/dvizh/data/uploads/media
grep -q '^UPLOADS_DIR=' .env 2>/dev/null || echo 'UPLOADS_DIR=/opt/dvizh/data/uploads' >> .env

echo "=== PostgreSQL ==="
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='dvizh'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER dvizh WITH PASSWORD 'dvizh_test_2026' CREATEDB;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='dvizh'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE dvizh OWNER dvizh;"

echo "=== Git pull ==="
if [ -d .git ]; then
  git fetch origin main
  git reset --hard origin/main
else
  git clone --depth 1 https://github.com/Gel788/dvizh.git "$APP"
  cd "$APP"
fi

echo "=== Dependencies + DB ==="
export NODE_OPTIONS="--max-old-space-size=2048"
npm ci
npx prisma generate
npx prisma db push
if [ "${SEED_DB:-}" = "1" ]; then
  echo "=== Seed (SEED_DB=1) ==="
  npm run db:seed 2>&1 | tail -8 || true
else
  echo "=== Seed skipped (users preserved). Set SEED_DB=1 to reset demo data ==="
fi

echo "=== Build ==="
npm run build

echo "=== PM2 ==="
pm2 delete dvizh 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# автозапуск после ребута
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

systemctl restart nginx 2>/dev/null || true
sleep 4

echo "=== API smoke ==="
curl -sf "http://127.0.0.1:3000/api/v1/health" | head -c 200 && echo ""
curl -s -o /dev/null -w "login: HTTP %{http_code}\n" -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@dvizh.app","password":"demo1234"}'
TOKEN=$(curl -sf -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@dvizh.app","password":"demo1234"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -n "$TOKEN" ]; then
  curl -sf -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/v1/profile" | head -c 120 && echo ""
  curl -sf -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/v1/feed/curated?city=Москва" | head -c 120 && echo ""
  curl -s -o /dev/null -w "move_activities: HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/v1/move/activities?lat=55.75&lng=37.62&radiusKm=10"
  curl -s -o /dev/null -w "move_join_404: HTTP %{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/v1/move/activities/fake/join"
  echo "API OK — token works"
else
  echo "WARN: login failed — check seed and JWT_SECRET"
fi

CRON_SECRET=$(grep "^CRON_SECRET=" .env 2>/dev/null | cut -d= -f2- || true)
if [ -n "$CRON_SECRET" ]; then
  curl -s -o /dev/null -w "cron_no_auth: HTTP %{http_code}\n" http://127.0.0.1:3000/api/v1/cron/reminders
  curl -sf "http://127.0.0.1:3000/api/v1/cron/reminders?secret=$CRON_SECRET" | head -c 120 && echo ""
else
  echo "WARN: CRON_SECRET missing — skip cron smoke"
fi

if [ -f scripts/v38-acceptance-smoke.sh ]; then
  echo "=== v38 acceptance smoke ==="
  CRON_SECRET="${CRON_SECRET:-}" bash scripts/v38-acceptance-smoke.sh || echo "WARN: acceptance smoke failed"
fi

if [ -f scripts/v38-privacy-unit.ts ]; then
  echo "=== v38 privacy unit ==="
  npm run test:privacy || echo "WARN: privacy unit failed"
fi

curl -s -o /dev/null -w "Site: HTTP %{http_code}\n" https://flroal.ru/api/v1/health || \
  curl -s -o /dev/null -w "Site (http): HTTP %{http_code}\n" http://127.0.0.1/

pm2 list
