import {
  deleteWishlistItemRecord,
  updateWishlistItemRecord,
} from "@/lib/wishlist-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type PatchBody = {
  title?: string;
  price?: string | null;
  link?: string | null;
  comment?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<PatchBody>(request);
    const updated = await updateWishlistItemRecord(session.id, id, body ?? {});
    if (!updated) return jsonError("Подарок не найден", 404, "NOT_FOUND");
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
    const deleted = await deleteWishlistItemRecord(session.id, id);
    if (!deleted) return jsonError("Подарок не найден", 404, "NOT_FOUND");
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
