import { toggleFollow } from "@/lib/api/social-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { userId } = await ctx.params;
    const session = await requireSessionFromRequest(request);
    const result = await toggleFollow(userId, session);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
