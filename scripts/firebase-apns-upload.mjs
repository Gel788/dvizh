#!/usr/bin/env node
/**
 * Загрузка APNs Auth Key (.p8) в Firebase для iOS push.
 *
 * Требования:
 * 1. firebase login (giloyan111@gmail.com)
 * 2. В Google Cloud включён Mobile SDK API:
 *    https://console.developers.google.com/apis/api/mobilesdk-pa.googleapis.com/overview?project=dvizh-29747
 *
 * Использование:
 *   node scripts/firebase-apns-upload.mjs \
 *     --p8 ~/Downloads/AuthKey_KSMRNSKFD8.p8 \
 *     --key-id KSMRNSKFD8 \
 *     --team-id 69S9SFG485
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT = 'dvizh-29747';
const BUNDLE = 'com.example.dvizhApp';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const p8Path = arg('--p8', path.join(os.homedir(), 'Downloads/AuthKey_KSMRNSKFD8.p8'));
const keyId = arg('--key-id', 'KSMRNSKFD8');
const teamId = arg('--team-id', '69S9SFG485');

const cfgPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
if (!fs.existsSync(cfgPath)) {
  console.error('Сначала выполни: firebase login');
  process.exit(1);
}
if (!fs.existsSync(p8Path)) {
  console.error('Файл .p8 не найден:', p8Path);
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const token = cfg.tokens?.access_token;
if (!token) {
  console.error('Нет access_token в firebase-tools.json — выполни firebase login');
  process.exit(1);
}

const privateKey = fs.readFileSync(p8Path, 'utf8');
const url = `https://mobilesdk-pa.clients6.google.com/v1/projects/${PROJECT}/clients/ios:${BUNDLE}:setApnsAuthKey`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Goog-User-Project': PROJECT,
  },
  body: JSON.stringify({ keyId, privateKey }),
});

const text = await res.text();
if (!res.ok) {
  console.error('Ошибка загрузки APNs ключа:', res.status);
  console.error(text);
  console.error('\nЕсли SERVICE_DISABLED — включи Mobile SDK API:');
  console.error(`https://console.developers.google.com/apis/api/mobilesdk-pa.googleapis.com/overview?project=${PROJECT}`);
  console.error('\nИли загрузи вручную:');
  console.error(`https://console.firebase.google.com/project/${PROJECT}/settings/cloudmessaging`);
  console.error(`Key ID: ${keyId}`);
  console.error(`Team ID: ${teamId}`);
  console.error(`P8: ${p8Path}`);
  process.exit(1);
}

console.log('APNs ключ загружен в Firebase для', BUNDLE);
console.log(text.slice(0, 500));

// Team ID задаётся отдельным вызовом в консоли; проверь в Firebase → Cloud Messaging.
console.log('\nПроверь в Firebase Console → Cloud Messaging → Apple app:');
console.log(`Team ID должен быть ${teamId}`);
