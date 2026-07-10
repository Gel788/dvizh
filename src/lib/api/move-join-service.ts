import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { joinEvent, toggleGoing } from "@/lib/api/social-service";

export function normalizeMoveActivityId(rawId: string) {
  const id = rawId.trim();
  if (id.startsWith("ev-")) return { surfaceId: id, coreId: id.slice(3), kind: "event" as const };
  if (id.startsWith("p-")) return { surfaceId: id, coreId: id.slice(2), kind: "post" as const };
  return { surfaceId: id, coreId: id, kind: "unknown" as const };
}

async function resolveEvent(activityId: string) {
  const { coreId } = normalizeMoveActivityId(activityId);
  return db.event.findUnique({
    where: { id: coreId },
    include: {
      _count: { select: { attendees: true } },
      attendees: { select: { userId: true } },
    },
  });
}

async function resolvePost(activityId: string) {
  const { coreId } = normalizeMoveActivityId(activityId);
  return db.post.findUnique({
    where: { id: coreId },
    select: { id: true, authorId: true, title: true, _count: { select: { going: true } } },
  });
}

export async function joinMoveActivity(session: SessionUser, activityId: string) {
  const event = await resolveEvent(activityId);
  if (event) {
    const already = event.attendees.some((a) => a.userId === session.id);
    if (already) return { joined: true as const, pending: false as const, participantsCount: event._count.attendees };

    if (event.requiresApproval && event.organizerId !== session.id) {
      const pending = await db.moveJoinRequest.findFirst({
        where: {
          activityKind: "event",
          activityId: event.id,
          userId: session.id,
          status: "PENDING",
        },
      });
      if (pending) {
        return {
          joined: false as const,
          pending: true as const,
          requestId: pending.id,
          participantsCount: event._count.attendees,
        };
      }

      const request = await db.moveJoinRequest.create({
        data: {
          activityKind: "event",
          activityId: event.id,
          eventId: event.id,
          userId: session.id,
          status: "PENDING",
        },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
      return {
        joined: false as const,
        pending: true as const,
        requestId: request.id,
        request,
        participantsCount: event._count.attendees,
      };
    }

    await joinEvent(event.id, session);
    const participantsCount = await db.eventAttendee.count({ where: { eventId: event.id } });
    return { joined: true as const, pending: false as const, participantsCount };
  }

  const post = await resolvePost(activityId);
  if (post) {
    const result = await toggleGoing(post.id, session);
    const participantsCount = await db.going.count({ where: { postId: post.id } });
    return { joined: result.going, pending: false as const, participantsCount };
  }

  return null;
}

async function loadJoinRequest(requestId: string) {
  return db.moveJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
      event: { select: { id: true, organizerId: true, title: true, _count: { select: { attendees: true } } } },
    },
  });
}

export async function approveMoveJoinRequest(session: SessionUser, requestId: string) {
  const request = await loadJoinRequest(requestId);
  if (!request || request.status !== "PENDING") return null;
  if (request.activityKind !== "event" || !request.event) return null;
  if (request.event.organizerId !== session.id) return null;

  await db.moveJoinRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", resolvedAt: new Date() },
  });
  await db.eventAttendee.upsert({
    where: { eventId_userId: { eventId: request.event.id, userId: request.userId } },
    create: { eventId: request.event.id, userId: request.userId },
    update: {},
  });
  const participantsCount = await db.eventAttendee.count({ where: { eventId: request.event.id } });
  return { requestId, status: "approved" as const, participantsCount, request };
}

export async function declineMoveJoinRequest(session: SessionUser, requestId: string) {
  const request = await loadJoinRequest(requestId);
  if (!request || request.status !== "PENDING") return null;
  if (request.activityKind !== "event" || !request.event) return null;
  if (request.event.organizerId !== session.id) return null;

  await db.moveJoinRequest.update({
    where: { id: requestId },
    data: { status: "DECLINED", resolvedAt: new Date() },
  });
  return { requestId, status: "declined" as const, request };
}

export async function cancelMoveJoinRequest(session: SessionUser, requestId: string) {
  const request = await loadJoinRequest(requestId);
  if (!request || request.status !== "PENDING") return null;
  if (request.userId !== session.id) return null;

  await db.moveJoinRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", resolvedAt: new Date() },
  });
  return { requestId, status: "cancelled" as const, request };
}

export async function listMoveJoinRequestsForActivity(
  session: SessionUser,
  activityId: string,
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED" = "PENDING",
) {
  const event = await resolveEvent(activityId);
  if (!event || event.organizerId !== session.id) return [];

  return db.moveJoinRequest.findMany({
    where: { activityKind: "event", activityId: event.id, status },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
}

export async function getMoveJoinStateForViewer(userId: string, eventIds: string[]) {
  if (!eventIds.length) {
    return {
      pendingByEventId: new Map<string, string>(),
      requestsByEventId: new Map<string, Array<{
        id: string;
        userId: string;
        status: string;
        createdAt: Date;
        user: { id: string; name: string; username: string; avatar: string | null };
      }>>(),
    };
  }

  const [pendingMine, pendingForOrganizer] = await Promise.all([
    db.moveJoinRequest.findMany({
      where: { userId, activityKind: "event", activityId: { in: eventIds }, status: "PENDING" },
      select: { id: true, activityId: true },
    }),
    db.moveJoinRequest.findMany({
      where: {
        activityKind: "event",
        activityId: { in: eventIds },
        status: "PENDING",
        event: { organizerId: userId },
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingByEventId = new Map(pendingMine.map((r) => [r.activityId, r.id]));
  const requestsByEventId = new Map<string, typeof pendingForOrganizer>();
  for (const req of pendingForOrganizer) {
    const list = requestsByEventId.get(req.activityId) ?? [];
    list.push(req);
    requestsByEventId.set(req.activityId, list);
  }
  return { pendingByEventId, requestsByEventId };
}
