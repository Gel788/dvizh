#!/bin/bash
# Тюнинг nginx + sysctl для стабильного HTTPS на VPS
# Запуск: bash scripts/vps-nginx-tune.sh (на сервере в /opt/dvizh)
set -euo pipefail

DOMAIN="${DOMAIN:-flroal.ru}"
WWW="${WWW:-www.flroal.ru}"
APP_PORT="${APP_PORT:-3000}"

echo "=== sysctl (MTU probe, backlog) ==="
cat > /etc/sysctl.d/99-dvizh-net.conf << 'SYSCTL'
net.ipv4.tcp_mtu_probing = 1
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_slow_start_after_idle = 0
SYSCTL
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-dvizh-net.conf

echo "=== nginx main tuning ==="
grep -q 'worker_rlimit_nofile' /etc/nginx/nginx.conf \
  || sed -i '/^worker_processes/a worker_rlimit_nofile 65535;' /etc/nginx/nginx.conf
if grep -q 'worker_connections 768' /etc/nginx/nginx.conf; then
  sed -i 's/worker_connections 768/worker_connections 4096/' /etc/nginx/nginx.conf
fi
mkdir -p /etc/nginx/conf.d
cat > /etc/nginx/conf.d/dvizh-upstream.conf << NGX
upstream dvizh_app {
    server 127.0.0.1:${APP_PORT};
    keepalive 32;
}
NGX

echo "=== nginx site (clean SSL + proxy) ==="
CERT_DIR="/etc/letsencrypt/live/${WWW}"
if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
fi

cat > /etc/nginx/sites-available/dvizh << NGINX
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} ${WWW};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    ssl_buffer_size 4k;
    ssl_early_data off;

    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://dvizh_app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW};
    return 301 https://\$host\$request_uri;
}
NGINX

ln -sf /etc/nginx/sites-available/dvizh /etc/nginx/sites-enabled/dvizh
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t
systemctl restart nginx

echo "=== smoke ==="
curl -s -o /dev/null -w "local_https:%{time_total}s code:%{http_code}\n" https://127.0.0.1/api/v1/health -k -H "Host: ${WWW}"
curl -s -o /dev/null -w "public_https:%{time_total}s code:%{http_code}\n" "https://${WWW}/api/v1/health" || true
echo "=== done ==="
