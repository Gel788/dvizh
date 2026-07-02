import { getSharedGoalForUser } from "@/lib/shared-goal-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await ctx.params;
    const goal = await getSharedGoalForUser(session.id, id);
    if (!goal) return jsonError("Список не найден", 404, "NOT_FOUND");
    return jsonOk({ goal });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
