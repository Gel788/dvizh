#!/bin/bash
# Быстрый фикс 502 — вставь в веб-консоль VPS (Intent Lys)
set -e

systemctl restart ssh 2>/dev/null || systemctl restart sshd
fail2ban-client unban --all 2>/dev/null || true

swapon /swapfile 2>/dev/null || true

cd /opt/dvizh || exit 1

cat > .env << 'ENV'
DATABASE_URL=postgresql://dvizh:dvizh_test_2026@localhost:5432/dvizh?schema=public
JWT_SECRET=prod-dvizh-demo-secret-change-me
NODE_ENV=production
COOKIE_SECURE=false
ENV

pm2 delete dvizh 2>/dev/null || true
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 start npm --name dvizh -- start
pm2 save
systemctl restart nginx

sleep 4
curl -s -o /dev/null -w "App:  HTTP %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "Site: HTTP %{http_code}\n" http://127.0.0.1/
pm2 logs dvizh --lines 5 --nostream
