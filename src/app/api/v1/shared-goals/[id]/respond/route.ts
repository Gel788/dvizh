import { respondSharedGoalInvite } from "@/lib/shared-goal-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = { accept?: boolean };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<Body>(request);
    if (body?.accept === undefined) return jsonError("Укажите accept: true/false", 400, "INVALID_BODY");
    const result = await respondSharedGoalInvite(session.id, id, body.accept);
    if ("error" in result) {
      if (result.error === "NOT_FOUND") return jsonError("Список не найден", 404, "NOT_FOUND");
      return jsonError("Нельзя изменить ответ", 400, result.error);
    }
    return jsonOk(result);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
