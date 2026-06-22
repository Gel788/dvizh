import Link from "next/link";
import { Target, Trophy, Users, Zap } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { PageShell } from "@/components/layout/page-shell";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function ChallengesPage() {
  const session = await getSession();
  const city = session?.city ?? "Москва";

  const challenges = await db.post.findMany({
    where: { type: "CHALLENGE", city },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true },
      },
      challenge: {
        include: {
          participants: {
            include: { user: { select: { name: true, username: true, avatar: true } } },
            orderBy: { progress: "desc" },
            take: 5,
          },
          _count: { select: { reports: true, participants: true } },
        },
      },
      _count: { select: { likes: true, comments: true, going: true, reposts: true } },
      likes: session ? { where: { userId: session.id }, select: { id: true } } : false,
      going: session ? { where: { userId: session.id }, select: { id: true } } : false,
    },
  });

  const business = challenges.filter((c) => c.challenge?.isBusiness);
  const seasonal = challenges.filter((c) => c.challenge?.isSeasonal);

  return (
    <PageShell
      title="ЧЕЛЛЕНДЖИ"
      description="Принимай вызовы, отчитывайся и соревнуйся с соседями"
      icon={<Target className="h-6 w-6" />}
      accent="heat"
    >
      {/* Stats row */}
      {(business.length > 0 || seasonal.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {seasonal.length > 0 && (
            <div className="card-surface p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime/10 text-lime shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-2xl text-lime leading-none">{seasonal.length}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">сезонных челленджей</p>
              </div>
            </div>
          )}
          {business.length > 0 && (
            <div className="card-surface p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-heat/10 text-heat shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-2xl text-heat leading-none">{business.length}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">от бизнеса с наградами</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {challenges.length === 0 && (
        <div className="text-center py-20">
          <p className="font-heading text-3xl text-heat/50">ПОКА ТИХО</p>
          <p className="text-muted-foreground text-sm mt-3">Создай первый челлендж для города</p>
          <Link href="/create" className="btn-action btn-action-heat mt-6 inline-flex">
            <Zap className="h-4 w-4" />
            Бросить вызов
          </Link>
        </div>
      )}

      {/* Challenge list */}
      <div className="space-y-6">
        {challenges.map((post, i) => (
          <div key={post.id} className="space-y-3">
            <PostCard post={post} index={i} />

            {/* Mini leaderboard for challenge */}
            {post.challenge && post.challenge.participants.length > 0 && (
              <div className="ml-3 rounded-xl border border-white/[0.06] bg-card/60 p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em] mb-3">
                  Лидерборд
                </p>
                <div className="space-y-2.5">
                  {post.challenge.participants.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className={`font-heading text-sm w-5 text-center leading-none ${
                        idx === 0 ? "text-lime" : idx === 1 ? "text-foreground/50" : "text-foreground/30"
                      }`}>
                        {idx + 1}
                      </span>
                      <Link
                        href={`/profile/${p.user.username}`}
                        className="flex-1 text-sm font-semibold hover:text-lime transition-colors cursor-pointer truncate"
                      >
                        {p.user.name}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-lime to-[#9AFF00]"
                            style={{ width: `${Math.min(100, (p.progress / post.challenge!.goalCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-lime w-10 text-right">
                          {p.progress}/{post.challenge!.goalCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
