import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

const postInclude = (userId?: string) => ({
  author: {
    select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true },
  },
  challenge: {
    include: {
      participants: { select: { id: true } },
      _count: { select: { reports: true } },
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

  return { post, comments };
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

  return { marked: true };
}

export async function completeSharedGoalItem(userId: string, itemId: string) {
  const item = await db.sharedGoalItem.findUnique({
    where: { id: itemId },
    include: { goal: { include: { members: true } } },
  });
  if (!item) return { error: "NOT_FOUND" };
  const isMember = item.goal.members.some((m) => m.userId === userId);
  if (!isMember) return { error: "FORBIDDEN" };

  await db.sharedGoalItem.update({
    where: { id: itemId },
    data: { done: true, assigneeId: userId },
  });
  return { done: true };
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
