import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { publishMoveActivityToFeed } from "@/lib/api/move-feed-publication";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await context.params;
    const activityId = id?.trim();
    if (!activityId) return jsonError("id обязателен", 400, "INVALID");

    const result = await publishMoveActivityToFeed(session, activityId);
    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 403;
      return jsonError(result.message, status, result.code);
    }

    return jsonOk(result, result.alreadyPublished ? 200 : 201);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
