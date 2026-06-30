import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export type FriendshipState = "none" | "friends" | "pending_sent" | "pending_received";

export async function getFriendshipState(
  userId: string,
  targetUserId: string,
): Promise<{ state: FriendshipState; friendshipId: string | null }> {
  if (userId === targetUserId) return { state: "none", friendshipId: null };

  const row = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: userId },
      ],
    },
  });

  if (!row) return { state: "none", friendshipId: null };
  if (row.status === "ACCEPTED") return { state: "friends", friendshipId: row.id };

  if (row.requesterId === userId) {
    return { state: "pending_sent", friendshipId: row.id };
  }
  return { state: "pending_received", friendshipId: row.id };
}

export async function sendFriendRequest(session: SessionUser, targetUserId: string) {
  if (session.id === targetUserId) return { error: "Нельзя добавить себя" };

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    include: { privacySettings: true },
  });
  if (!target) return { error: "Пользователь не найден" };

  const privacy = target.privacySettings?.friendRequests ?? "everyone";
  if (privacy === "nobody") return { error: "Пользователь не принимает заявки" };

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.id, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: session.id },
      ],
    },
  });

  if (existing?.status === "ACCEPTED") return { state: "friends" as const, friendshipId: existing.id };
  if (existing?.status === "PENDING") {
    if (existing.requesterId === targetUserId) {
      await db.friendship.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
      return { state: "friends" as const, friendshipId: existing.id, accepted: true };
    }
    return { state: "pending_sent" as const, friendshipId: existing.id };
  }

  const friendship = await db.friendship.create({
    data: { requesterId: session.id, addresseeId: targetUserId, status: "PENDING" },
  });

  await db.notification.create({
    data: {
      userId: targetUserId,
      type: "FOLLOW",
      title: `${session.name} хочет добавить вас в друзья`,
      body: `@${session.username}`,
      link: `/profile/${session.username}`,
    },
  });

  return { state: "pending_sent" as const, friendshipId: friendship.id };
}

export async function acceptFriendRequest(session: SessionUser, friendshipId: string) {
  const row = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!row || row.addresseeId !== session.id || row.status !== "PENDING") {
    return { error: "Заявка не найдена" };
  }

  await db.friendship.update({ where: { id: friendshipId }, data: { status: "ACCEPTED" } });

  await db.notification.create({
    data: {
      userId: row.requesterId,
      type: "FOLLOW",
      title: `${session.name} принял(а) заявку в друзья`,
      body: `@${session.username}`,
      link: `/profile/${session.username}`,
    },
  });

  return { state: "friends" as const, friendshipId };
}

export async function rejectFriendRequest(session: SessionUser, friendshipId: string) {
  const row = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!row) return { error: "Заявка не найдена" };
  if (row.addresseeId !== session.id && row.requesterId !== session.id) {
    return { error: "Нет доступа" };
  }

  await db.friendship.delete({ where: { id: friendshipId } });
  return { ok: true };
}

export async function enrichUsersWithSocial(
  viewerId: string,
  userIds: string[],
): Promise<
  Record<string, { isFollowing: boolean; friendshipState: FriendshipState; friendshipId: string | null }>
> {
  if (userIds.length === 0) return {};

  const [follows, friendships] = await Promise.all([
    db.follow.findMany({
      where: { followerId: viewerId, followingId: { in: userIds } },
      select: { followingId: true },
    }),
    db.friendship.findMany({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: { in: userIds } },
          { requesterId: { in: userIds }, addresseeId: viewerId },
        ],
      },
    }),
  ]);

  const followingSet = new Set(follows.map((f) => f.followingId));
  const out: Record<
    string,
    { isFollowing: boolean; friendshipState: FriendshipState; friendshipId: string | null }
  > = {};

  for (const id of userIds) {
    out[id] = { isFollowing: followingSet.has(id), friendshipState: "none", friendshipId: null };
  }

  for (const row of friendships) {
    const otherId = row.requesterId === viewerId ? row.addresseeId : row.requesterId;
    if (!out[otherId]) continue;

    if (row.status === "ACCEPTED") {
      out[otherId] = { ...out[otherId], friendshipState: "friends", friendshipId: row.id };
    } else if (row.requesterId === viewerId) {
      out[otherId] = { ...out[otherId], friendshipState: "pending_sent", friendshipId: row.id };
    } else {
      out[otherId] = { ...out[otherId], friendshipState: "pending_received", friendshipId: row.id };
    }
  }

  return out;
}

export async function listPendingFriendRequests(userId: string) {
  const incoming = await db.friendship.findMany({
    where: { addresseeId: userId, status: "PENDING" },
    include: {
      requester: {
        select: { id: true, name: true, username: true, avatar: true, verified: true, city: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return incoming.map((r) => ({
    id: r.id,
    user: r.requester,
    createdAt: r.createdAt,
  }));
}
