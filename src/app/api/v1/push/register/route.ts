import { registerPushDevice, unregisterPushDevice } from "@/lib/push/push-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = { token?: string; platform?: string };

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    const token = body?.token?.trim();
    if (!token) return jsonError("Нужен token", 400, "INVALID_BODY");
    await registerPushDevice(session.id, token, body?.platform ?? "unknown");
    return jsonOk({ registered: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    const token = body?.token?.trim();
    if (!token) return jsonError("Нужен token", 400, "INVALID_BODY");
    await unregisterPushDevice(session.id, token);
    return jsonOk({ removed: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
