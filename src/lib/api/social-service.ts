import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export async function toggleLike(postId: string, session: SessionUser) {
  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await db.like.create({ data: { postId, userId: session.id } });
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== session.id) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "LIKE",
        title: `${session.name} лайкнул ваш пост`,
        body: post.content.slice(0, 80),
        link: `/post/${postId}`,
      },
    });
  }
  return { liked: true };
}

export async function toggleGoing(postId: string, session: SessionUser) {
  const existing = await db.going.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  });

  if (existing) {
    await db.going.delete({ where: { id: existing.id } });
    return { going: false };
  }

  await db.going.create({ data: { postId, userId: session.id } });
  return { going: true };
}

export async function joinChallenge(challengeId: string, session: SessionUser) {
  await db.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId, userId: session.id } },
    create: { challengeId, userId: session.id },
    update: {},
  });
  return { joined: true };
}

export async function joinEvent(eventId: string, session: SessionUser) {
  await db.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId: session.id } },
    create: { eventId, userId: session.id },
    update: {},
  });
  return { joined: true };
}
