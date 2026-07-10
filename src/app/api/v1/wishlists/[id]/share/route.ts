import { createWishlistShareLink } from "@/lib/wishlist-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id } = await ctx.params;
    const link = await createWishlistShareLink(session.id, id);
    if (!link) return jsonError("Список не найден", 404, "NOT_FOUND");
    return jsonOk({ share: link });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
