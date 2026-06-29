#!/bin/bash
# Запускай с Mac, где SSH работает:
#   bash scripts/ssh-deploy.sh
# Или с паролем:
#   SSHPASS='твой-пароль' bash scripts/ssh-deploy.sh
set -euo pipefail

HOST="${DEPLOY_HOST:-83.222.27.82}"
USER="${DEPLOY_USER:-root}"
PORT="${DEPLOY_PORT:-22}"

if [ -z "${SSHPASS:-}" ] && [ -z "${SSH_AUTH_SOCK:-}" ]; then
  echo "Введи пароль root (не отображается):"
  read -rs SSHPASS
  export SSHPASS
  USE_SSHPASS=1
fi

run_remote() {
  local cmd="$1"
  if [ -n "${USE_SSHPASS:-}" ] || [ -n "${SSHPASS:-}" ]; then
    sshpass -e ssh -o StrictHostKeyChecking=accept-new -p "$PORT" "${USER}@${HOST}" "$cmd"
  else
    ssh -o StrictHostKeyChecking=accept-new -p "$PORT" "${USER}@${HOST}" "$cmd"
  fi
}

echo "=== SSH $USER@$HOST:$PORT ==="
run_remote "hostname && cd /opt/dvizh && git fetch origin main && git reset --hard origin/main && bash scripts/vps-deploy.sh"

echo ""
echo "=== Проверка снаружи ==="
curl -s --max-time 15 "https://www.flroal.ru/api/v1/health" || true
echo ""
