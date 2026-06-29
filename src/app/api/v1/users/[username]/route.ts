import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Ctx = { params: Promise<{ username: string }> };

const userSelect = {
  id: true,
  name: true,
  username: true,
  avatar: true,
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
  const isFollowing = session
    ? !!(await db.follow.findUnique({
        where: { followerId_followingId: { followerId: session.id, followingId: user.id } },
      }))
    : false;

  const posts = await db.post.findMany({
    where: { authorId: user.id },
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
    posts,
    followers: followers.map((f) => f.follower),
  });
}
