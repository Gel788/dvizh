#!/bin/bash
# Локально: пуш в GitHub + инструкция для VPS
# На VPS: bash scripts/vps-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Проверка сборки ==="
npm run build

echo "=== Git push ==="
branch="${1:-main}"
git add -A
if git diff --cached --quiet; then
  echo "Нет изменений для коммита."
else
  git commit -m "$(cat <<'EOF'
feat: REST API v1 для мобилки — auth, feed, diary, profile, friends

Полный бэкенд /api/v1 для Flutter: дневник CRUD, профиль PATCH, друзья, лента, nearby, челленджи.
EOF
)"
fi
git push origin "$branch"

echo ""
echo "=== Деплой на VPS (веб-консоль Intent Lys / SSH) ==="
echo "curl -fsSL https://raw.githubusercontent.com/Gel788/dvizh/${branch}/scripts/vps-deploy.sh | bash"
echo ""
echo "Или на сервере:"
echo "  cd /opt/dvizh && git pull && bash scripts/vps-deploy.sh"
