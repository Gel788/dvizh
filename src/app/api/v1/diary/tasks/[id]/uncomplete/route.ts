import { uncompleteDiaryTaskForUser } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id } = await params;
    const result = await uncompleteDiaryTaskForUser(session.id, id);
    return jsonOk(result);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
