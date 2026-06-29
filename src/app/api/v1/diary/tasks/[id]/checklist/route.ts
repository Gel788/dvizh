import { toggleChecklistItemForUser } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<{ index?: number }>(request);
    const index = body?.index;
    if (index == null || index < 0) {
      return jsonError("index обязателен", 400, "INVALID");
    }
    const items = await toggleChecklistItemForUser(session.id, id, index);
    if (!items) return jsonError("Задача не найдена", 404, "NOT_FOUND");
    return jsonOk({ checklistItems: items });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
