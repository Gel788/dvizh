#!/bin/bash
# SSL для flroal.ru — вставь в веб-консоль VPS (Intent Lys / 83.222.27.82)
# Перед запуском: A-запись flroal.ru и www → IP сервера (83.222.27.82)
set -euo pipefail

DOMAIN=flroal.ru
WWW=www.flroal.ru
EMAIL="${CERTBOT_EMAIL:-albertgiloan@gmail.com}"
APP_PORT=3000

echo "=== DNS check ==="
SERVER_IP=$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"
for h in "$DOMAIN" "$WWW"; do
  R=$(dig +short "$h" A | tail -1)
  echo "$h -> $R"
  if [ "$R" != "$SERVER_IP" ]; then
    echo "WARN: $h не указывает на этот сервер ($SERVER_IP). Certbot может упасть."
  fi
done

echo "=== nginx site ==="
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx nginx 2>/dev/null || true

cat > /etc/nginx/sites-available/dvizh << NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/dvizh /etc/nginx/sites-enabled/dvizh
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl reload nginx

echo "=== certbot ==="
certbot --nginx \
  -d "$WWW" -d "$DOMAIN" \
  --non-interactive --agree-tos \
  -m "$EMAIL" \
  --redirect

echo "=== app .env (cookies + site url) ==="
ENV_FILE=/opt/dvizh/.env
if [ -f "$ENV_FILE" ]; then
  grep -q '^NEXT_PUBLIC_SITE_URL=' "$ENV_FILE" \
    && sed -i 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://'"$WWW"'|' "$ENV_FILE" \
    || echo "NEXT_PUBLIC_SITE_URL=https://$WWW" >> "$ENV_FILE"
  grep -q '^SITE_URL=' "$ENV_FILE" \
    && sed -i 's|^SITE_URL=.*|SITE_URL=https://'"$WWW"'|' "$ENV_FILE" \
    || echo "SITE_URL=https://$WWW" >> "$ENV_FILE"
  grep -q '^COOKIE_SECURE=' "$ENV_FILE" \
    && sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' "$ENV_FILE" \
    || echo "COOKIE_SECURE=true" >> "$ENV_FILE"
fi

pm2 restart dvizh 2>/dev/null || true
systemctl reload nginx

echo "=== done ==="
curl -sI "https://$WWW" | head -5 || true
curl -sI "https://$DOMAIN" | head -5 || true
