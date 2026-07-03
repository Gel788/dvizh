import { completeSharedGoalItem } from "@/lib/api/social-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await requireSessionFromRequest(request);
    const result = await completeSharedGoalItem(session.id, id);
    if ("error" in result) {
      const code =
        result.error === "FORBIDDEN" || result.error === "INVITE_PENDING"
          ? 403
          : 404;
      return jsonError("Недоступно", code, result.error);
    }
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
