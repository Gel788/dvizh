import { db } from "@/lib/db";
import { getFirebaseMessaging, isPushConfigured } from "@/lib/push/firebase-admin";
import type { NotificationType } from "@prisma/client";

export type PushPayload = {
  title: string;
  body: string;
  link?: string | null;
  type?: NotificationType;
};

export async function registerPushDevice(userId: string, token: string, platform: string) {
  const clean = token.trim();
  if (!clean) throw new Error("EMPTY_TOKEN");
  // Один актуальный токен на пользователя — старые после переустановки приложения мешают доставке.
  await db.pushDevice.deleteMany({ where: { userId, token: { not: clean } } });
  await db.pushDevice.upsert({
    where: { token: clean },
    create: { userId, token: clean, platform: platform || "unknown" },
    update: { userId, platform: platform || "unknown", updatedAt: new Date() },
  });
}

export async function unregisterPushDevice(userId: string, token: string) {
  await db.pushDevice.deleteMany({ where: { userId, token: token.trim() } });
}

async function sendToTokens(tokens: string[], payload: PushPayload) {
  const messaging = getFirebaseMessaging();
  if (!messaging || tokens.length === 0) return { sent: 0, failed: 0 };

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: {
      ...(payload.link ? { link: payload.link } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      title: payload.title,
      body: payload.body,
    },
    apns: {
      headers: {
        "apns-push-type": "alert",
        "apns-priority": "10",
      },
      payload: {
        aps: {
          alert: { title: payload.title, body: payload.body },
          sound: "default",
          badge: 1,
        },
      },
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "dvizh_push",
        title: payload.title,
        body: payload.body,
      },
    },
  });

  const invalid: string[] = [];
  const errors: string[] = [];
  res.responses.forEach((r, i) => {
    if (!r.success) {
      invalid.push(tokens[i]!);
      if (r.error?.code) errors.push(`${r.error.code}: ${r.error.message ?? ""}`.slice(0, 120));
    }
  });
  if (invalid.length) {
    await db.pushDevice.deleteMany({ where: { token: { in: invalid } } });
  }
  if (errors.length) {
    console.warn("[push] FCM errors:", errors.slice(0, 5).join(" | "));
  }

  return { sent: res.successCount, failed: res.failureCount, errors };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const devices = await db.pushDevice.findMany({ where: { userId }, select: { token: true } });
  return sendToTokens(
    devices.map((d) => d.token),
    payload,
  );
}

export async function sendPushBroadcast(payload: PushPayload) {
  const devices = await db.pushDevice.findMany({ select: { token: true } });
  const tokens = devices.map((d) => d.token);
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, devices: 0, configured: isPushConfigured() };
  }
  const chunkSize = 500;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    const result = await sendToTokens(chunk, payload);
    sent += result.sent;
    failed += result.failed;
    if (result.errors?.length) errors.push(...result.errors);
  }
  return { sent, failed, devices: tokens.length, configured: isPushConfigured(), errors: errors.slice(0, 5) };
}

export async function notifyUser(
  userId: string,
  payload: PushPayload & { type: NotificationType },
) {
  await db.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link ?? null,
    },
  });
  await sendPushToUser(userId, payload);
}
