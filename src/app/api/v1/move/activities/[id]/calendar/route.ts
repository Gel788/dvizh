import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { addMoveActivityToCalendar, removeMoveActivityFromCalendar } from "@/lib/api/move-calendar-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await context.params;
    const activityId = id?.trim();
    if (!activityId) return jsonError("id обязателен", 400, "INVALID");

    const body = await readJson<{ title?: string; note?: string; scheduledAt?: string }>(request);
    const created = await addMoveActivityToCalendar(session, activityId, body ?? undefined);
    if (!created) return jsonError("Активность не найдена", 404, "NOT_FOUND");

    return jsonOk({ calendarLink: created }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await context.params;
    const activityId = id?.trim();
    if (!activityId) return jsonError("id обязателен", 400, "INVALID");

    const removed = await removeMoveActivityFromCalendar(session, activityId);
    if (!removed) return jsonError("Связь с календарём не найдена", 404, "NOT_FOUND");

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
