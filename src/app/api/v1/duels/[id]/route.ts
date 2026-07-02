import { getDuelForUser } from "@/lib/duel-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await ctx.params;
    const duel = await getDuelForUser(session.id, id);
    if (!duel) return jsonError("Спор не найден", 404, "NOT_FOUND");
    return jsonOk({ duel });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
