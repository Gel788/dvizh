import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDiaryBundle } from "@/lib/diary-actions";
import { getFriendshipState } from "@/lib/api/friendship-service";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getSession();

  const user = await db.user.findUnique({
    where: { username },
    include: {
      badges: { include: { badge: true } },
      _count: {
        select: { posts: true, followers: true, following: true, challengeParts: true },
      },
    },
  });

  if (!user) notFound();

  const isOwn = session?.id === user.id;

  const isFollowing = session
    ? !!(await db.follow.findUnique({
        where: { followerId_followingId: { followerId: session.id, followingId: user.id } },
      }))
    : false;

  const friendship = session && !isOwn
    ? await getFriendshipState(session.id, user.id)
    : { state: "none" as const, friendshipId: null };

  const posts = await db.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
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
      likes: session ? { where: { userId: session.id }, select: { id: true } } : false,
      going: session ? { where: { userId: session.id }, select: { id: true } } : false,
    },
  });

  const diaryBundle = isOwn ? await getDiaryBundle(user.id) : undefined;

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка профиля…</div>}>
      <ProfileView
        user={{ ...user, createdAt: user.createdAt }}
        isOwn={isOwn}
        isFollowing={isFollowing}
        friendshipState={friendship.state}
        friendshipId={friendship.friendshipId}
        sessionId={session?.id}
        posts={posts}
        diaryBundle={diaryBundle}
      />
    </Suspense>
  );
}
