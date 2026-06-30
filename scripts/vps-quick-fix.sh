#!/bin/bash
# Быстрый фикс 502 — вставь в веб-консоль VPS (Intent Lys, 83.222.27.82)
set -euo pipefail

echo "=== 502 quick fix ==="
date

systemctl restart ssh 2>/dev/null || systemctl restart sshd 2>/dev/null || true
fail2ban-client unban --all 2>/dev/null || true
swapon /swapfile 2>/dev/null || true

APP=/opt/dvizh
cd "$APP" || { echo "ERROR: $APP not found"; exit 1; }

if [ ! -f .env ]; then
  cat > .env << 'ENV'
DATABASE_URL=postgresql://dvizh:dvizh_test_2026@localhost:5432/dvizh?schema=public
JWT_SECRET=prod-dvizh-demo-secret-change-me
NODE_ENV=production
COOKIE_SECURE=true
SITE_URL=https://www.flroal.ru
NEXT_PUBLIC_SITE_URL=https://www.flroal.ru
ENV
fi

echo "=== PostgreSQL ==="
systemctl start postgresql 2>/dev/null || true
sudo -u postgres psql -tc "SELECT 1" >/dev/null || echo "WARN: postgres not responding"

echo "=== PM2 before ==="
pm2 list || npm i -g pm2

if [ ! -d .next ]; then
  echo "WARN: .next missing — need full deploy (vps-deploy.sh)"
fi

pm2 delete dvizh 2>/dev/null || true
export NODE_OPTIONS="--max-old-space-size=2048"
if [ -f ecosystem.config.cjs ]; then
  pm2 start ecosystem.config.cjs
else
  pm2 start npm --name dvizh -- start
fi
pm2 save

systemctl restart nginx 2>/dev/null || true
sleep 5

echo "=== Health ==="
curl -s -o /dev/null -w "localhost:3000 -> HTTP %{http_code}\n" http://127.0.0.1:3000/api/v1/health || echo "localhost:3000 -> FAIL"
curl -s -o /dev/null -w "nginx       -> HTTP %{http_code}\n" http://127.0.0.1/api/v1/health || true

echo "=== PM2 logs (last 15 lines) ==="
pm2 logs dvizh --lines 15 --nostream 2>/dev/null || true
pm2 list
