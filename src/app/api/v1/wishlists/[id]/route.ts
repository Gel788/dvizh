import {
  deleteWishlistRecord,
  updateWishlistRecord,
} from "@/lib/wishlist-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type PatchBody = {
  title?: string;
  occasion?: string | null;
  eventAt?: string | null;
  visibility?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<PatchBody>(request);
    const updated = await updateWishlistRecord(session.id, id, body ?? {});
    if (!updated) return jsonError("Список не найден", 404, "NOT_FOUND");
    return jsonOk(updated);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const deleted = await deleteWishlistRecord(session.id, id);
    if (!deleted) return jsonError("Список не найден", 404, "NOT_FOUND");
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
