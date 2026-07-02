import { cloneDuelForUser } from "@/lib/duel-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await ctx.params;
    const duel = await cloneDuelForUser(session.id, id);
    if (!duel) return jsonError("Спор не найден", 404, "NOT_FOUND");
    return jsonOk({ duel }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "MIN_PARTICIPANTS") {
      return jsonError("Нужно минимум 2 участника", 400, "MIN_PARTICIPANTS");
    }
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
