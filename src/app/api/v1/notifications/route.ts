import { listNotifications, markNotificationsRead } from "@/lib/api/social-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const data = await listNotifications(session.id);
    return jsonOk(data);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<{ ids?: string[] }>(request);
    await markNotificationsRead(session.id, body?.ids);
    const data = await listNotifications(session.id);
    return jsonOk(data);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
