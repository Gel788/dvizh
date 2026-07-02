import { pinMediaItem } from "@/lib/api/social-create-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type PatchBody = { pinned?: boolean };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<PatchBody>(request);
    const result = await pinMediaItem(session, id, body?.pinned ?? true);
    if ("error" in result) return jsonError("Не найдено", 404, "NOT_FOUND");
    return jsonOk(result);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
