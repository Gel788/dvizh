import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { joinMoveActivity } from "@/lib/api/move-join-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await context.params;
    const activityId = id?.trim();
    if (!activityId) return jsonError("id обязателен", 400, "INVALID");

    const result = await joinMoveActivity(session, activityId);
    if (!result) return jsonError("Активность не найдена", 404, "NOT_FOUND");

    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
