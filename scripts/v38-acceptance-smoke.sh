#!/bin/bash
# Smoke по BACKEND_ACCEPTANCE_CRITERIA.md — endpoint-level checks после деплоя.
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:3000/api/v1}"
EMAIL="${SMOKE_EMAIL:-demo@dvizh.app}"
PASS="${SMOKE_PASS:-demo1234}"

pass=0
fail=0

check_http() {
  local name="$1"
  local code="$2"
  local expect="$3"
  if [ "$code" = "$expect" ]; then
    echo "PASS: $name (HTTP $code)"
    pass=$((pass + 1))
  else
    echo "FAIL: $name (HTTP $code, expected $expect)"
    fail=$((fail + 1))
  fi
}

echo "=== v38 acceptance smoke ==="

LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo "$LOGIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
  echo "FAIL: login"
  exit 1
fi
echo "PASS: login"
pass=$((pass + 1))
AUTH="Authorization: Bearer $TOKEN"

check_http "GET /auth/me" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/auth/me")" "200"
check_http "GET /profile" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/profile")" "200"

check_http "GET /friends?view=list" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/friends?view=list")" "200"
check_http "GET /friends?view=pending" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/friends?view=pending")" "200"

check_http "GET /move/activities" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/move/activities?lat=55.75&lng=37.62&radiusKm=10")" "200"
check_http "POST /move/activities/fake/join" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "$AUTH" "$API_BASE/move/activities/fake-id/join")" "404"

check_http "GET /leaderboard/challenges" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/leaderboard/challenges?scope=city")" "200"

YEAR=$(date +%Y)
MONTH=$(date +%m | sed 's/^0//')
check_http "GET /diary/calendar" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/diary/calendar?year=$YEAR&month=$MONTH")" "200"

check_http "GET /feed/curated" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/feed/curated?city=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0")" "200"
check_http "GET /duels" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/duels")" "200"
check_http "GET /shared-goals" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/shared-goals")" "200"
check_http "GET /search" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API_BASE/search?q=demo")" "200"
check_http "POST /reports invalid" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "$AUTH" -H 'Content-Type: application/json' -d '{}' "$API_BASE/reports")" "400"

CRON_SECRET="${CRON_SECRET:-}"
if [ -n "$CRON_SECRET" ]; then
  check_http "GET /cron/reminders" "$(curl -s -o /dev/null -w '%{http_code}' "$API_BASE/cron/reminders?secret=$CRON_SECRET")" "200"
fi

echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
