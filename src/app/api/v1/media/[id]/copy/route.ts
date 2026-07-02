import { copyMediaFromUser } from "@/lib/media-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id } = await params;
    const copied = await copyMediaFromUser(session.id, id);
    if (!copied) return jsonError("Нельзя скопировать", 400, "COPY_FAILED");
    return jsonOk(copied, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
