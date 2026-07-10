import { cancelWishlistReservationRecord } from "@/lib/wishlist-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id } = await params;
    const result = await cancelWishlistReservationRecord(session.id, session.username, id);
    if ("error" in result) {
      const msg =
        result.error === "NOT_RESERVED"
          ? "Бронь не найдена"
          : result.error === "FORBIDDEN"
            ? "Нельзя отменить чужую бронь"
            : "Недоступно";
      return jsonError(msg, 400, result.error);
    }
    return jsonOk(result);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
