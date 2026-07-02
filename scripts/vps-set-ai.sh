#!/bin/bash
# GigaChat AI на VPS
set -euo pipefail
: "${GIGACHAT_CREDENTIALS:?Задай GIGACHAT_CREDENTIALS=... (Authorization key из Studio)}"

APP="${APP_DIR:-/opt/dvizh}"
cd "$APP"
touch .env

sed -i '/^DEEPSEEK_API_KEY=/d;/^GROQ_/d;/^YANDEX_/d;/^AI_HTTP_PROXY=/d;/^LITELLM_/d;/^AI_PROVIDER=/d' .env 2>/dev/null || true

if grep -q '^GIGACHAT_CREDENTIALS=' .env; then
  sed -i "s|^GIGACHAT_CREDENTIALS=.*|GIGACHAT_CREDENTIALS=${GIGACHAT_CREDENTIALS}|" .env
else
  echo "GIGACHAT_CREDENTIALS=${GIGACHAT_CREDENTIALS}" >> .env
fi

grep -q '^GIGACHAT_SCOPE=' .env || echo 'GIGACHAT_SCOPE=GIGACHAT_API_PERS' >> .env
if grep -q '^GIGACHAT_MODEL=' .env; then
  sed -i 's|^GIGACHAT_MODEL=.*|GIGACHAT_MODEL=GigaChat-2-Pro|' .env
else
  echo 'GIGACHAT_MODEL=GigaChat-2-Pro' >> .env
fi
if grep -q '^AI_MODEL=' .env; then
  sed -i 's|^AI_MODEL=.*|AI_MODEL=GigaChat-2-Pro|' .env
else
  echo 'AI_MODEL=GigaChat-2-Pro' >> .env
fi
grep -q '^AI_DAILY_LIMIT=' .env || echo 'AI_DAILY_LIMIT=10' >> .env

pm2 restart dvizh --update-env
sleep 4

TOKEN=$(curl -sf -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@dvizh.app","password":"demo1234"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

echo "=== AI usage ==="
curl -sf -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3000/api/v1/ai/chat
echo
echo "=== AI test ==="
curl -sf -X POST http://127.0.0.1:3000/api/v1/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Добавь задачу: пробежка 5 км"}' | head -c 800
echo
