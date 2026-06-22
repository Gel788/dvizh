import { notFound } from "next/navigation";
import Link from "next/link";
import { toggleFollowAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/feed/post-card";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
        select: {
          posts: true,
          followers: true,
          following: true,
          challengeParts: true,
        },
      },
    },
  });

  if (!user) notFound();

  const isFollowing = session
    ? await db.follow.findUnique({
        where: {
          followerId_followingId: { followerId: session.id, followingId: user.id },
        },
      })
    : null;

  const posts = await db.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          verified: true,
          city: true,
          district: true,
        },
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

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <div className="h-24 bg-sidebar" />
        <CardContent className="relative pt-0 pb-6 px-6">
          <Avatar className="h-20 w-20 -mt-10 ring-4 ring-card">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback className="text-xl">{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                {user.name}
                {user.verified && (
                  <Badge className="bg-secondary/15 text-secondary border-0 text-xs">
                    Verified
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                {[user.district, user.city].filter(Boolean).join(", ")}
              </p>
            </div>
            {session && session.id !== user.id && (
              <form action={toggleFollowAction.bind(null, user.id)}>
                <Button
                  type="submit"
                  variant={isFollowing ? "outline" : "default"}
                  className="cursor-pointer"
                >
                  {isFollowing ? "Отписаться" : "Подписаться"}
                </Button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <span>
              <strong>{user._count.posts}</strong>{" "}
              <span className="text-muted-foreground">постов</span>
            </span>
            <span>
              <strong>{user._count.followers}</strong>{" "}
              <span className="text-muted-foreground">подписчиков</span>
            </span>
            <span>
              <strong>{user._count.following}</strong>{" "}
              <span className="text-muted-foreground">подписок</span>
            </span>
            <span>
              <strong>{user.reputation}</strong>{" "}
              <span className="text-muted-foreground">репутация</span>
            </span>
          </div>

          {user.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {user.badges.map((ub) => (
                <Badge key={ub.badge.id} variant="outline">
                  {ub.badge.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-heading font-bold text-lg">Посты</h2>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
