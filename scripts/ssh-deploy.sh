#!/bin/bash
# Деплой на VPS с Mac:
#   bash scripts/ssh-deploy.sh
# С явным ключом:
#   DEPLOY_SSH_KEY=~/.ssh/id_rsa_server bash scripts/ssh-deploy.sh
# С паролем (fallback):
#   SSHPASS='...' bash scripts/ssh-deploy.sh
set -euo pipefail

HOST="${DEPLOY_HOST:-83.222.27.82}"
USER="${DEPLOY_USER:-root}"
PORT="${DEPLOY_PORT:-22}"
SSH_KEY="${DEPLOY_SSH_KEY:-${SSH_KEY:-$HOME/.ssh/id_rsa_server}}"

SSH_BASE=(ssh -o StrictHostKeyChecking=accept-new -p "$PORT" -o ConnectTimeout=20)
if [ -f "$SSH_KEY" ]; then
  SSH_BASE+=(-i "$SSH_KEY" -o IdentitiesOnly=yes)
fi

run_remote() {
  local cmd="$1"
  if [ -n "${SSHPASS:-}" ] && command -v sshpass >/dev/null 2>&1; then
    sshpass -e ssh -o StrictHostKeyChecking=accept-new -p "$PORT" \
      -o PreferredAuthentications=password -o PubkeyAuthentication=no \
      "${USER}@${HOST}" "$cmd"
  else
    "${SSH_BASE[@]}" "${USER}@${HOST}" "$cmd"
  fi
}

echo "=== SSH $USER@$HOST:$PORT ==="
if [ -f "$SSH_KEY" ]; then
  echo "Ключ: $SSH_KEY"
fi

run_remote "hostname && cd /opt/dvizh && git fetch origin main && git reset --hard origin/main && bash scripts/vps-deploy.sh"

echo ""
echo "=== Проверка снаружи ==="
curl -s --max-time 15 "https://www.flroal.ru/api/v1/health" || true
echo ""
