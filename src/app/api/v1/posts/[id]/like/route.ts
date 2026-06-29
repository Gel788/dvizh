import { joinChallenge, joinEvent, toggleGoing, toggleLike } from "@/lib/api/social-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

async function withAuth(id: string, request: Request, fn: (id: string, session: Awaited<ReturnType<typeof requireSessionFromRequest>>) => Promise<unknown>) {
  try {
    const session = await requireSessionFromRequest(request);
    const result = await fn(id, session);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withAuth(id, request, (postId, session) => toggleLike(postId, session));
}
