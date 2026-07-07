#!/bin/bash
# Добавляет FIREBASE_SERVICE_ACCOUNT_JSON в /opt/dvizh/.env на VPS
# Использование:
#   SSHPASS='...' bash scripts/vps-firebase-push.sh ~/Downloads/dvizh-29747-firebase-adminsdk.json
set -euo pipefail

JSON_FILE="${1:-}"
HOST="${DEPLOY_HOST:-83.222.27.82}"
USER="${DEPLOY_USER:-root}"

if [ -z "$JSON_FILE" ] || [ ! -f "$JSON_FILE" ]; then
  echo "Скачай JSON из Firebase Console:"
  echo "  Project Settings → Service accounts → Generate new private key"
  echo ""
  echo "Запуск: SSHPASS='...' bash scripts/vps-firebase-push.sh /path/to/service-account.json"
  exit 1
fi

run_remote() {
  if [ -n "${SSHPASS:-}" ] && command -v sshpass >/dev/null; then
    sshpass -e ssh -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" "$@"
  else
    ssh -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" "$@"
  fi
}

run_scp() {
  if [ -n "${SSHPASS:-}" ] && command -v sshpass >/dev/null; then
    sshpass -e scp -o StrictHostKeyChecking=accept-new "$1" "${USER}@${HOST}:$2"
  else
    scp -o StrictHostKeyChecking=accept-new "$1" "${USER}@${HOST}:$2"
  fi
}

run_scp "$JSON_FILE" "/tmp/firebase-sa.json"

run_remote bash -s <<'REMOTE'
set -euo pipefail
cd /opt/dvizh
python3 <<'PY'
import json, pathlib, secrets

env_path = pathlib.Path("/opt/dvizh/.env")
lines = []
if env_path.exists():
    lines = [l for l in env_path.read_text().splitlines() if not l.startswith("FIREBASE_SERVICE_ACCOUNT_JSON=") and not l.startswith("CRON_SECRET=")]

compact = json.dumps(json.load(open("/tmp/firebase-sa.json")))
lines.append(f"FIREBASE_SERVICE_ACCOUNT_JSON={compact}")
if not any(l.startswith("CRON_SECRET=") for l in lines):
    lines.append(f"CRON_SECRET={secrets.token_hex(16)}")

env_path.write_text("\n".join(lines) + "\n")
print("FIREBASE_SERVICE_ACCOUNT_JSON saved")
PY
rm -f /tmp/firebase-sa.json
pm2 restart dvizh
REMOTE

echo "Готово. Проверь APNs key: Firebase → Cloud Messaging → Apple app"
