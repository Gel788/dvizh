import { db } from "@/lib/db";
import { normalizePostImages } from "@/lib/media-url";
import type { SessionUser } from "@/lib/auth";

const postInclude = (userId?: string) => ({
  author: {
    select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true },
  },
  challenge: {
    include: {
      participants: userId ? { where: { userId }, select: { id: true } } : false,
      _count: { select: { reports: true, participants: true } },
    },
  },
  _count: { select: { likes: true, comments: true, going: true, reposts: true } },
  likes: userId ? { where: { userId }, select: { id: true } } : undefined,
  going: userId ? { where: { userId }, select: { id: true } } : undefined,
  reposts: userId ? { where: { userId }, select: { id: true } } : undefined,
});

export async function getPostById(postId: string, session?: SessionUser | null) {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: postInclude(session?.id),
  });
  if (!post) return null;

  const comments = await db.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  return {
    post: { ...post, images: normalizePostImages(post.images) },
    comments,
  };
}

export async function addComment(postId: string, content: string, session: SessionUser) {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Пустой комментарий" };

  const comment = await db.comment.create({
    data: { postId, userId: session.id, content: trimmed },
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });

  const post = await db.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== session.id) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENT",
        title: `${session.name} прокомментировал`,
        body: trimmed.slice(0, 80),
        link: `/post/${postId}`,
      },
    });
  }

  return { comment };
}

export async function toggleRepost(postId: string, session: SessionUser) {
  const existing = await db.repost.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  });

  if (existing) {
    await db.repost.delete({ where: { id: existing.id } });
    return { reposted: false };
  }

  await db.repost.create({ data: { postId, userId: session.id } });
  return { reposted: true };
}

export async function toggleFollow(targetUserId: string, session: SessionUser) {
  if (session.id === targetUserId) return { following: false };

  const privacy = await db.privacySettings.findUnique({ where: { userId: targetUserId } });
  if (privacy?.subscriptions === "nobody") {
    return { error: "FORBIDDEN" as const };
  }
  if (privacy?.subscriptions === "friends") {
    const friend = await db.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: session.id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: session.id },
        ],
      },
    });
    if (!friend) return { error: "FRIENDS_ONLY" as const };
  }

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: session.id, followingId: targetUserId } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return { following: false };
  }

  await db.follow.create({
    data: { followerId: session.id, followingId: targetUserId },
  });

  await db.notification.create({
    data: {
      userId: targetUserId,
      type: "FOLLOW",
      title: `${session.name} подписался на вас`,
      body: `@${session.username}`,
      link: `/profile/${session.username}`,
    },
  });

  return { following: true };
}

export async function listNotifications(userId: string) {
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, unreadCount };
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  if (ids?.length) {
    await db.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    });
  } else {
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
  return { ok: true };
}

export async function markDuelForUser(userId: string, duelId: string) {
  const part = await db.duelParticipant.findUnique({
    where: { duelId_userId: { duelId, userId } },
  });
  if (!part) return { error: "NOT_PARTICIPANT" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const already = await db.duelMark.findFirst({
    where: { participantId: part.id, markedAt: { gte: today } },
  });
  if (already) return { alreadyMarked: true };

  await db.$transaction([
    db.duelMark.create({ data: { participantId: part.id } }),
    db.duelParticipant.update({
      where: { id: part.id },
      data: { streak: part.streak + 1, totalMarks: part.totalMarks + 1 },
    }),
  ]);

  const duel = await db.duel.findUnique({ where: { id: duelId }, select: { title: true, visibility: true, emoji: true } });
  if (duel && duel.visibility !== "PRIVATE") {
    await db.activity.create({
      data: {
        userId,
        type: "DUEL_MARKED",
        visibility: duel.visibility,
        title: duel.title,
        body: duel.emoji ?? "⚔️",
        metadata: JSON.stringify({ duelId }),
      },
    });
  }

  return { marked: true };
}

import { completeSharedGoalItemRecord } from "@/lib/shared-goal-service";

export async function completeSharedGoalItem(userId: string, itemId: string) {
  return completeSharedGoalItemRecord(userId, itemId);
}

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
  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    include: { post: { select: { id: true, title: true } } },
  });
  if (!challenge) return { joined: false, participantsCount: 0 };

  await db.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId, userId: session.id } },
    create: { challengeId, userId: session.id },
    update: {},
  });

  const existing = await db.activity.findFirst({
    where: { userId: session.id, type: "CHALLENGE_JOINED", postId: challenge.post.id },
  });
  if (!existing) {
    await db.activity.create({
      data: {
        userId: session.id,
        type: "CHALLENGE_JOINED",
        visibility: "FRIENDS",
        title: challenge.post.title ?? "Вызов",
        postId: challenge.post.id,
      },
    });
  }

  const participantsCount = await db.challengeParticipant.count({ where: { challengeId } });
  return { joined: true, participantsCount };
}

export async function leaveChallenge(challengeId: string, session: SessionUser) {
  await db.challengeParticipant.deleteMany({
    where: { challengeId, userId: session.id },
  });
  const participantsCount = await db.challengeParticipant.count({ where: { challengeId } });
  return { joined: false, participantsCount };
}

export async function joinEvent(eventId: string, session: SessionUser) {
  await db.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId: session.id } },
    create: { eventId, userId: session.id },
    update: {},
  });
  return { joined: true };
}
