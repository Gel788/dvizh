import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getFriendshipState } from "@/lib/api/friendship-service";
import { getBlockedUserIds, getHiddenPostIds, resolveRelation } from "@/lib/privacy-service";

type Ctx = { params: Promise<{ username: string }> };

const userSelect = {
  id: true,
  name: true,
  username: true,
  avatar: true,
  coverImage: true,
  bio: true,
  city: true,
  district: true,
  verified: true,
  reputation: true,
  createdAt: true,
  _count: { select: { posts: true, followers: true, following: true } },
} as const;

export async function GET(request: Request, ctx: Ctx) {
  const { username } = await ctx.params;
  const session = await getSessionFromRequest(request).catch(() => null);

  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: userSelect,
  });
  if (!user) return jsonError("Пользователь не найден", 404, "NOT_FOUND");

  const isOwn = session?.id === user.id;

  if (session && !isOwn) {
    const relation = await resolveRelation(session.id, user.id);
    if (relation === "blocked") {
      return jsonError("Профиль недоступен", 403, "BLOCKED");
    }
  }

  const isFollowing = session
    ? !!(await db.follow.findUnique({
        where: { followerId_followingId: { followerId: session.id, followingId: user.id } },
      }))
    : false;

  const friendship = session && !isOwn
    ? await getFriendshipState(session.id, user.id)
    : { state: "none" as const, friendshipId: null };

  let blockedIds: string[] = [];
  let hiddenPostIds: string[] = [];
  if (session?.id) {
    [blockedIds, hiddenPostIds] = await Promise.all([
      getBlockedUserIds(session.id),
      getHiddenPostIds(session.id),
    ]);
  }

  const posts = await db.post.findMany({
    where: {
      authorId: user.id,
      hiddenFromFeed: false,
      ...(hiddenPostIds.length ? { id: { notIn: hiddenPostIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true, verified: true } },
      challenge: true,
      _count: { select: { likes: true, comments: true, going: true } },
    },
  });

  const followers = await db.follow.findMany({
    where: { followingId: user.id },
    take: 20,
    include: { follower: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  return jsonOk({
    user,
    isOwn,
    isFollowing,
    friendshipState: friendship.state,
    friendshipId: friendship.friendshipId,
    posts,
    followers: followers
      .map((f) => f.follower)
      .filter((f) => !blockedIds.includes(f.id)),
  });
}
