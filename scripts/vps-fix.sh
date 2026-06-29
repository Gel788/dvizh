#!/bin/bash
# Вставь в веб-консоль VPS (Intent Lys), если SSH с Mac не пускает
set -euo pipefail

echo "=== SSH / fail2ban ==="
systemctl restart ssh 2>/dev/null || systemctl restart sshd
fail2ban-client unban --all 2>/dev/null || true

echo "=== Swap ==="
swapon /swapfile 2>/dev/null || {
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
}

APP=/opt/dvizh
mkdir -p "$APP"
cd "$APP"

echo "=== .env ==="
cat > .env << 'ENV'
DATABASE_URL=postgresql://dvizh:dvizh_test_2026@localhost:5432/dvizh?schema=public
JWT_SECRET=prod-dvizh-demo-secret-change-me
NODE_ENV=production
COOKIE_SECURE=false
ENV

echo "=== PostgreSQL ==="
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='dvizh'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER dvizh WITH PASSWORD 'dvizh_test_2026' CREATEDB;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='dvizh'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE dvizh OWNER dvizh;"

if [ -d .git ]; then
  echo "=== Git pull ==="
  git pull --ff-only || git fetch --depth 1 && git reset --hard origin/main
else
  echo "=== Git clone ==="
  rm -rf /opt/dvizh.bak
  mv "$APP" /opt/dvizh.bak 2>/dev/null || true
  git clone --depth 1 https://github.com/Gel788/dvizh.git "$APP"
  cd "$APP"
fi

npm ci
npx prisma generate
npx prisma db push
npm run db:seed 2>&1 | tail -5 || true

export NODE_OPTIONS="--max-old-space-size=2048"
npm run build 2>&1 | tail -15 || echo "Build failed — run scripts/vps-deploy.sh"

pm2 delete dvizh 2>/dev/null || true
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 start npm --name dvizh -- start
pm2 save

systemctl restart nginx
sleep 3
curl -s -o /dev/null -w "App : HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w "Site: HTTP %{http_code}\n" http://127.0.0.1/ || true
pm2 list
