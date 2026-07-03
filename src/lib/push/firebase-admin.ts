import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let app: App | null = null;

function initApp(): App | null {
  if (getApps().length) return getApps()[0]!;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const serviceAccount = JSON.parse(raw) as Record<string, string>;
    app = initializeApp({ credential: cert(serviceAccount) });
    return app;
  } catch {
    return null;
  }
}

export function getFirebaseMessaging(): Messaging | null {
  const instance = app ?? initApp();
  if (!instance) return null;
  return getMessaging(instance);
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}
