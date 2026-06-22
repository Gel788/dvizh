import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { PostCard } from "@/components/feed/post-card";
import { CommentForm } from "@/components/feed/comment-form";
import { ChallengeReportForm } from "@/components/feed/challenge-report-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const post = await db.post.findUnique({
    where: { id },
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
          reports: {
            include: {
              user: { select: { name: true, username: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { reports: true } },
        },
      },
      comments: {
        include: {
          user: { select: { name: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true, comments: true, going: true, reposts: true } },
      likes: session ? { where: { userId: session.id }, select: { id: true } } : false,
      going: session ? { where: { userId: session.id }, select: { id: true } } : false,
    },
  });

  if (!post) notFound();

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <PostCard post={post} />

      {post.challenge && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-heading font-bold text-lg">Отчёты участников</h2>
            {session && (
              <ChallengeReportForm
                challengeId={post.challenge.id}
                postId={post.id}
              />
            )}
            <div className="space-y-3">
              {post.challenge.reports.map((report) => (
                <div key={report.id} className="flex gap-3 p-3 rounded-xl bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.user.avatar ?? undefined} />
                    <AvatarFallback>{report.user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/profile/${report.user.username}`}
                      className="text-sm font-medium hover:text-primary cursor-pointer"
                    >
                      {report.user.name}
                    </Link>
                    <p className="text-sm mt-0.5">{report.content}</p>
                    <time className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-heading font-bold text-lg">
            Комментарии ({post.comments.length})
          </h2>
          {session && <CommentForm postId={post.id} />}
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar ?? undefined} />
                  <AvatarFallback>{comment.user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/profile/${comment.user.username}`}
                    className="text-sm font-medium hover:text-primary cursor-pointer"
                  >
                    {comment.user.name}
                  </Link>
                  <p className="text-sm mt-0.5">{comment.content}</p>
                  <time className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
