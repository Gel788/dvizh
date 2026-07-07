#!/usr/bin/env node
/**
 * Диагностика FCM без Prisma — токены через psql.
 * VPS: cd /opt/dvizh && node scripts/push-diagnose.mjs
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function loadFirebaseJson() {
  const env = readFileSync(".env", "utf8");
  const key = "FIREBASE_SERVICE_ACCOUNT_JSON=";
  const idx = env.indexOf(key);
  if (idx === -1) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON не найден в .env");
  let raw = env.slice(idx + key.length).trim();
  if (raw.startsWith("{")) {
    const end = raw.indexOf("\n", raw.indexOf("}"));
    if (end > 0) raw = raw.slice(0, end);
    return JSON.parse(raw);
  }
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  return JSON.parse(raw.replace(/\\n/g, "\n"));
}

function queryDevices() {
  const env = readFileSync(".env", "utf8");
  const dbLine = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
  const dbUrl = dbLine.replace(/\?schema=public$/, "");
  const sql = `SELECT pd.platform, u.username, pd."updatedAt", pd.token
FROM "PushDevice" pd JOIN "User" u ON u.id = pd."userId"
ORDER BY pd."updatedAt" DESC LIMIT 20;`;
  const out = execSync(`psql "${dbUrl}" -t -A -F '|' -f -`, {
    encoding: "utf8",
    input: sql,
  });
  return out
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [platform, username, updatedAt, token] = line.split("|");
      return { platform, username, updatedAt, token };
    });
}

function initFirebase(sa) {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(sa) });
}

const title = process.argv[2] || "ДВИЖ тест";
const body = process.argv[3] || `Диагностика ${new Date().toISOString()}`;

console.log("=== PUSH DIAGNOSE ===\n");

const sa = loadFirebaseJson();
console.log("Firebase project:", sa.project_id);

const devices = queryDevices();
console.log("\n--- PushDevice ---");
console.log("Всего (top 20):", devices.length);
for (const d of devices) {
  const t = d.token ?? "";
  console.log(
    `  ${d.platform?.padEnd(7)} ${d.username?.padEnd(10)} ${d.updatedAt} | ${t.slice(0, 14)}…${t.slice(-6)} (${t.length})`,
  );
}

const ios = devices.filter((d) => d.platform === "ios");
console.log("\niOS в выборке:", ios.length);

if (!devices.length) process.exit(0);

initFirebase(sa);
const messaging = getMessaging();
const target = ios[0] ?? devices[0];

console.log("\n--- send() на самый свежий токен ---");
console.log("User:", target.username, "| updated:", target.updatedAt);

const payload = {
  token: target.token,
  notification: { title, body },
  data: { title, body, type: "DIAGNOSE" },
  apns: {
    headers: { "apns-push-type": "alert", "apns-priority": "10" },
    payload: { aps: { alert: { title, body }, sound: "default", badge: 1 } },
  },
};

try {
  const id = await messaging.send(payload);
  console.log("✅ FCM send OK:", id);
  console.log("→ Закрой приложение / заблокируй экран. Должен быть баннер.");
} catch (e) {
  console.log("❌ FCM send FAIL:", e.code, e.message);
}

console.log("\n--- sendEachForMulticast (все токены) ---");
const tokens = devices.map((d) => d.token).filter(Boolean);
const batch = await messaging.sendEachForMulticast({
  tokens,
  notification: { title: title + " [batch]", body },
  apns: {
    headers: { "apns-push-type": "alert", "apns-priority": "10" },
    payload: { aps: { alert: { title: title + " [batch]", body }, sound: "default" } },
  },
});
console.log("success:", batch.successCount, "| failed:", batch.failureCount);
batch.responses.forEach((r, i) => {
  if (!r.success) {
    console.log(`  FAIL #${i + 1}: ${r.error?.code} — ${r.error?.message}`);
  }
});

if (batch.successCount > 0 && batch.failureCount === 0) {
  console.log("\n⚠️  FCM принял все токены, но баннера нет → проверь:");
  console.log("   1. Firebase Console → APNs Auth Key (.p8) для com.example.dvizhApp");
  console.log("   2. iOS Настройки → ДВЖ → Уведомления");
  console.log("   3. Актуальный токен (открой приложение под gel888)");
  console.log("   4. Release-сборка (aps-environment: production)");
}
