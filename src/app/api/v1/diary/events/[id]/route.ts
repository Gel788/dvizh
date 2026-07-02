import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id } = await params;
    const deleted = await db.personalCalendarEvent.deleteMany({
      where: { id, userId: session.id },
    });
    if (!deleted.count) return jsonError("Событие не найдено", 404, "NOT_FOUND");
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
