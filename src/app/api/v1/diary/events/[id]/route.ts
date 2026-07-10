import { updatePersonalEventForUser } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  title?: string;
  eventType?: string;
  eventDate?: string;
  hasTime?: boolean;
  scheduledAt?: string | null;
  isRecurring?: boolean;
  recurrence?: string | null;
  reminderAt?: string | null;
  visibility?: string;
  note?: string | null;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<PatchBody>(request);
    if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");

    const updated = await updatePersonalEventForUser(session.id, id, body);
    if (!updated) return jsonError("Событие не найдено", 404, "NOT_FOUND");
    return jsonOk({ event: updated });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

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
