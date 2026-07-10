import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

type ResolvedMoveActivity = {
  activityId: string;
  title: string;
  body?: string;
  sourcePostId?: string;
  sourceEventId?: string;
  city: string;
  district?: string | null;
  eligible: boolean;
};

async function resolveMoveActivity(
  session: SessionUser,
  activityId: string,
): Promise<ResolvedMoveActivity | null> {
  const post = await db.post.findUnique({
    where: { id: activityId },
    select: { id: true, title: true, content: true, city: true, district: true },
  });
  if (post) {
    const [going, calendar] = await Promise.all([
      db.going.findUnique({
        where: { postId_userId: { postId: activityId, userId: session.id } },
      }),
      db.personalCalendarEvent.findFirst({
        where: { userId: session.id, sourceKind: "move", sourceId: activityId },
      }),
    ]);
    return {
      activityId,
      title: post.title?.trim() || post.content.slice(0, 80),
      body: post.content,
      sourcePostId: post.id,
      city: post.city,
      district: post.district,
      eligible: !!(going || calendar),
    };
  }

  const event = await db.event.findUnique({
    where: { id: activityId },
    select: { id: true, title: true, description: true, city: true, district: true },
  });
  if (event) {
    const [attendee, calendar] = await Promise.all([
      db.eventAttendee.findUnique({
        where: { eventId_userId: { eventId: activityId, userId: session.id } },
      }),
      db.personalCalendarEvent.findFirst({
        where: { userId: session.id, sourceKind: "move", sourceId: activityId },
      }),
    ]);
    return {
      activityId,
      title: event.title,
      body: event.description,
      sourceEventId: event.id,
      city: event.city,
      district: event.district,
      eligible: !!(attendee || calendar),
    };
  }

  const calendarOnly = await db.personalCalendarEvent.findFirst({
    where: { userId: session.id, sourceKind: "move", sourceId: activityId },
  });
  if (calendarOnly) {
    return {
      activityId,
      title: calendarOnly.title,
      body: calendarOnly.note ?? undefined,
      city: session.city,
      district: session.district,
      eligible: true,
    };
  }

  return null;
}

export async function publishMoveActivityToFeed(session: SessionUser, activityId: string) {
  const resolved = await resolveMoveActivity(session, activityId);
  if (!resolved) {
    return { ok: false as const, code: "NOT_FOUND" as const, message: "Активность не найдена" };
  }
  if (!resolved.eligible) {
    return {
      ok: false as const,
      code: "NOT_ELIGIBLE" as const,
      message: "Сначала отметь участие, интерес или добавь в календарь",
    };
  }

  const metaNeedle = `"moveActivityId":"${activityId}"`;
  const existing = await db.activity.findFirst({
    where: {
      userId: session.id,
      type: "EVENT_ATTENDED",
      OR: [
        ...(resolved.sourcePostId ? [{ postId: resolved.sourcePostId }] : []),
        { metadata: { contains: metaNeedle } },
      ],
    },
    select: { id: true, title: true, postId: true, createdAt: true },
  });
  if (existing) {
    return {
      ok: true as const,
      publication: {
        id: existing.id,
        activityId,
        title: existing.title,
        status: "published" as const,
        createdAt: existing.createdAt.toISOString(),
        postId: existing.postId,
      },
      alreadyPublished: true,
    };
  }

  const feedTitle = `Я иду: ${resolved.title}`;
  const feedContent = resolved.body?.trim() || feedTitle;

  const publicationPost = await db.post.create({
    data: {
      type: "ACTIVITY",
      authorId: session.id,
      title: feedTitle,
      content: feedContent,
      city: resolved.city || session.city,
      district: resolved.district ?? session.district,
      lat: session.lat,
      lng: session.lng,
      hiddenFromFeed: false,
    },
    select: { id: true },
  });

  const activity = await db.activity.create({
    data: {
      userId: session.id,
      type: "EVENT_ATTENDED",
      visibility: "PUBLIC",
      title: feedTitle,
      body: resolved.sourceEventId ? resolved.body ?? null : null,
      postId: resolved.sourcePostId ?? publicationPost.id,
      metadata: JSON.stringify({
        moveActivityId: activityId,
        sourcePostId: resolved.sourcePostId ?? null,
        sourceEventId: resolved.sourceEventId ?? null,
        publicationPostId: publicationPost.id,
      }),
    },
    select: { id: true, title: true, postId: true, createdAt: true },
  });

  return {
    ok: true as const,
    publication: {
      id: activity.id,
      activityId,
      title: activity.title,
      status: "published" as const,
      createdAt: activity.createdAt.toISOString(),
      postId: publicationPost.id,
      feedPostId: publicationPost.id,
    },
    alreadyPublished: false,
  };
}
