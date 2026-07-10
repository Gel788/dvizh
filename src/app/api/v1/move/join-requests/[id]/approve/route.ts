import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { approveMoveJoinRequest } from "@/lib/api/move-join-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await context.params;
    const requestId = id?.trim();
    if (!requestId) return jsonError("id обязателен", 400, "INVALID");

    const result = await approveMoveJoinRequest(session, requestId);
    if (!result) return jsonError("Заявка не найдена или недоступна", 404, "NOT_FOUND");

    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
