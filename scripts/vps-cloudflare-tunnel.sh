#!/bin/bash
# Cloudflare Tunnel — обход проблем TLS до VPS (провайдер/DPI/маршрут)
#
# 1) Зарегистрируй домен в Cloudflare (бесплатно), смени NS на Beget → Cloudflare
# 2) На VPS: bash scripts/vps-cloudflare-tunnel.sh
# 3) В панели CF: Zero Trust → Networks → Tunnels → Create → cloudflared
#
# Или быстрый тест без DNS (временный URL):
#   cloudflared tunnel --url http://127.0.0.1:3000
set -euo pipefail

TUNNEL_NAME="${TUNNEL_NAME:-dvizh}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN="${DOMAIN:-flroal.ru}"
WWW="${WWW:-www.flroal.ru}"

echo "=== install cloudflared ==="
if ! command -v cloudflared >/dev/null 2>&1; then
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) CF_ARCH=amd64 ;;
    aarch64) CF_ARCH=arm64 ;;
    *) echo "Unsupported arch: $ARCH"; exit 1 ;;
  esac
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" \
    -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi
cloudflared --version

echo ""
echo "=== Следующие шаги (нужен аккаунт Cloudflare) ==="
echo "1. cloudflared tunnel login"
echo "2. cloudflared tunnel create ${TUNNEL_NAME}"
echo "3. Настрой DNS в Cloudflare:"
echo "   CNAME ${WWW} -> <TUNNEL_ID>.cfargotunnel.com (proxied)"
echo "   CNAME @ -> <TUNNEL_ID>.cfargotunnel.com (proxied)  # или redirect apex→www"
echo ""
echo "4. Создай /etc/cloudflared/config.yml:"
cat << YAML
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: ${WWW}
    service: http://127.0.0.1:${APP_PORT}
  - hostname: ${DOMAIN}
    service: http://127.0.0.1:${APP_PORT}
  - service: http_status:404
YAML
echo ""
echo "5. cloudflared service install && systemctl enable --now cloudflared"
echo ""
echo "=== Быстрый тест (временный URL, без DNS) ==="
echo "cloudflared tunnel --url http://127.0.0.1:${APP_PORT}"
