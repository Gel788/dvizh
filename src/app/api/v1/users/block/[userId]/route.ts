import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { userId } = await ctx.params;
    if (!userId || userId === session.id) {
      return jsonError("Нельзя заблокировать себя", 400, "INVALID");
    }

    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return jsonError("Пользователь не найден", 404, "NOT_FOUND");

    await db.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: session.id, blockedId: userId } },
      create: { blockerId: session.id, blockedId: userId },
      update: {},
    });

    return jsonOk({ ok: true, blocked: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { userId } = await ctx.params;
    await db.userBlock.deleteMany({
      where: { blockerId: session.id, blockedId: userId },
    });
    return jsonOk({ ok: true, blocked: false });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
