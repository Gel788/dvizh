import { createPersonalEventForUser } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type CreateEventBody = {
  title?: string;
  eventType?: string;
  eventDate?: string;
  hasTime?: boolean;
  scheduledAt?: string;
  isRecurring?: boolean;
  recurrence?: string;
  reminderAt?: string;
  visibility?: string;
  note?: string;
  sourceKind?: string;
  sourceId?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<CreateEventBody>(request);
    if (!body?.title?.trim()) return jsonError("Название обязательно", 400, "EMPTY");
    if (!body.eventDate) return jsonError("Дата обязательна", 400, "NO_DATE");

    const created = await createPersonalEventForUser(session.id, {
      title: body.title,
      eventType: body.eventType,
      eventDate: body.eventDate,
      hasTime: body.hasTime,
      scheduledAt: body.scheduledAt,
      isRecurring: body.isRecurring,
      recurrence: body.recurrence,
      reminderAt: body.reminderAt,
      visibility: body.visibility,
      note: body.note,
      sourceKind: body.sourceKind,
      sourceId: body.sourceId,
    });
    if (!created) return jsonError("Не удалось создать", 400, "FAILED");
    return jsonOk({ event: created }, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
