import { pinMediaItem } from "@/lib/api/social-create-service";
import { deleteMediaItem, updateMediaItem } from "@/lib/media-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type PatchBody = {
  title?: string;
  type?: string;
  pinned?: boolean;
  status?: string;
  rating?: number | null;
  review?: string | null;
  visibility?: string;
  coverUrl?: string | null;
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const deleted = await deleteMediaItem(session.id, id);
    if (!deleted) return jsonError("Не найдено", 404, "NOT_FOUND");
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<PatchBody>(request);

    if (body?.pinned !== undefined && Object.keys(body).length === 1) {
      const result = await pinMediaItem(session, id, body.pinned);
      if ("error" in result) return jsonError("Не найдено", 404, "NOT_FOUND");
      return jsonOk(result);
    }

    const updated = await updateMediaItem(session.id, id, body ?? {});
    if (!updated) return jsonError("Не найдено", 404, "NOT_FOUND");
    return jsonOk(updated);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
