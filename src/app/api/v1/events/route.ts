import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type CreateEventBody = {
  title?: string;
  description?: string;
  city?: string;
  district?: string;
  startAt?: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  requiresApproval?: boolean;
};

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<CreateEventBody>(request);
    if (!body?.title?.trim()) return jsonError("Название обязательно", 400, "EMPTY");
    if (!body.startAt) return jsonError("Дата начала обязательна", 400, "NO_DATE");

    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) return jsonError("Некорректная дата", 400, "INVALID_DATE");

    const event = await db.event.create({
      data: {
        title: body.title.trim(),
        description: (body.description ?? body.title).trim(),
        organizerId: session.id,
        city: body.city?.trim() || session.city,
        district: body.district?.trim() || session.district || null,
        startAt,
        lat: body.lat ?? session.lat,
        lng: body.lng ?? session.lng,
        requiresApproval: body.requiresApproval === true,
        capacity: Math.max(0, Number(body.capacity ?? 0)),
        attendees: { create: { userId: session.id } },
      },
      include: {
        organizer: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        _count: { select: { attendees: true } },
      },
    });

    return jsonOk({ event }, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
