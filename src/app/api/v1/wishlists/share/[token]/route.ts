import { getWishlistByShareToken } from "@/lib/wishlist-service";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token?.trim()) return jsonError("Токен обязателен", 400, "INVALID_TOKEN");

  const session = await getSessionFromRequest(request).catch(() => null);
  const result = await getWishlistByShareToken(
    token.trim(),
    session?.id,
    session?.username,
  );

  if (!result) return jsonError("Ссылка не найдена", 404, "NOT_FOUND");
  if ("error" in result) return jsonError("Нет доступа", 403, result.error);

  return jsonOk(result);
}
