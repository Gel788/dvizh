import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id: postId } = await ctx.params;

    const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return jsonError("Пост не найден", 404, "NOT_FOUND");

    await db.hiddenPost.upsert({
      where: { userId_postId: { userId: session.id, postId } },
      create: { userId: session.id, postId },
      update: {},
    });

    return jsonOk({ ok: true, hidden: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
