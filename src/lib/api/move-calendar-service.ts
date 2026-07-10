import { createPersonalEventForUser } from "@/lib/diary-actions";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { normalizeMoveActivityId } from "@/lib/api/move-join-service";

async function resolveActivityForCalendar(activityId: string) {
  const { coreId } = normalizeMoveActivityId(activityId);
  const event = await db.event.findUnique({
    where: { id: coreId },
    select: { id: true, title: true, description: true, startAt: true },
  });
  if (event) {
    return {
      sourceId: event.id,
      title: event.title,
      description: event.description,
      scheduledAt: event.startAt,
    };
  }

  const post = await db.post.findUnique({
    where: { id: coreId },
    select: { id: true, title: true, content: true, createdAt: true },
  });
  if (post) {
    return {
      sourceId: post.id,
      title: post.title?.trim() || post.content.slice(0, 80),
      description: post.content,
      scheduledAt: post.createdAt,
    };
  }

  return null;
}

export async function addMoveActivityToCalendar(
  session: SessionUser,
  activityId: string,
  input?: { title?: string; note?: string; scheduledAt?: string },
) {
  const resolved = await resolveActivityForCalendar(activityId);
  if (!resolved) return null;

  const scheduledAt = input?.scheduledAt ? new Date(input.scheduledAt) : resolved.scheduledAt;
  if (Number.isNaN(scheduledAt.getTime())) return null;

  const title = input?.title?.trim() || resolved.title;
  const eventDate = scheduledAt.toISOString().slice(0, 10);

  return createPersonalEventForUser(session.id, {
    title,
    eventType: "move",
    eventDate,
    hasTime: true,
    scheduledAt: scheduledAt.toISOString(),
    visibility: "private",
    note: input?.note?.trim() || resolved.description || undefined,
    sourceKind: "move",
    sourceId: resolved.sourceId,
  });
}

export async function removeMoveActivityFromCalendar(session: SessionUser, activityId: string) {
  const { coreId } = normalizeMoveActivityId(activityId);
  const link = await db.personalCalendarEvent.findFirst({
    where: {
      userId: session.id,
      sourceKind: "move",
      OR: [{ sourceId: coreId }, { sourceId: activityId }],
    },
    select: { id: true },
  });
  if (!link) return false;
  await db.personalCalendarEvent.delete({ where: { id: link.id } });
  return true;
}
