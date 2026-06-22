import Link from "next/link";
import { Suspense } from "react";
import { Flame, Target, Users, Zap, Calendar } from "lucide-react";
import { TrendMarquee } from "@/components/brand/marquee";
import { FeedFilters } from "@/components/feed/feed-filters";
import { PostCard } from "@/components/feed/post-card";
import { getFeedPosts, getStats } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { CITY_COORDS } from "@/lib/geo";
import type { PostType } from "@prisma/client";

type SearchParams = Promise<{
  feed?: string; city?: string; type?: string;
  district?: string; tag?: string; radius?: string;
}>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  const stats = await getStats();

  const city = params.city ?? session?.city ?? "Москва";
  const coords = CITY_COORDS[city] ?? CITY_COORDS["Москва"];

  const posts = await getFeedPosts({
    feed: (params.feed as "all" | "following" | "nearby") ?? "all",
    city,
    type: (params.type as PostType | "ALL") ?? "ALL",
    district: params.district,
    tag: params.tag,
    radiusKm: Number(params.radius ?? 10),
    userLat: session?.lat ?? coords.lat,
    userLng: session?.lng ?? coords.lng,
  });

  return (
    <div className="dvizh-grid min-h-full">
      <TrendMarquee />

      <div className="mx-auto max-w-2xl px-4 py-6 lg:py-8 space-y-5">
        {/* ── HERO ─────────────────────────────────────── */}
        <section className="dvizh-hero relative overflow-hidden rounded-2xl border border-white/[0.09] p-7 lg:p-10">
          {/* background ornaments */}
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-lime/[0.08] blur-[80px]" />
          <div className="pointer-events-none absolute left-0 bottom-0 h-52 w-52 rounded-full bg-heat/[0.07] blur-[60px]" />

          <div className="relative z-10">
            {/* pill */}
            <span className="chip chip-lime mb-5 inline-flex">
              <Zap className="h-3 w-3" />
              молодёжный движ
            </span>

            {/* Main heading */}
            <h1 className="font-heading text-[56px] lg:text-[80px] xl:text-[96px] leading-none text-foreground tracking-wider">
              ДВИ<span className="text-neon-lime">Ж</span>
            </h1>

            <p className="mt-4 text-sm lg:text-base text-muted-foreground max-w-sm font-medium leading-relaxed">
              Твой город. Твои челленджи. Твои люди.&nbsp;
              <span className="text-foreground/70">Без занудства — только действие.</span>
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 mt-6">
              <StatPill icon={<Users className="h-3.5 w-3.5" />} value={stats.users} label="в движе" />
              <StatPill icon={<Flame className="h-3.5 w-3.5 text-heat" />} value={stats.postsToday} label="сегодня" />
              <StatPill icon={<Target className="h-3.5 w-3.5 text-lime" />} value={stats.challenges} label="челленджей" />
              <StatPill icon={<Calendar className="h-3.5 w-3.5 text-ice" />} value={stats.events} label="ивентов" />
            </div>

            {/* CTA */}
            {!session && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-action">
                  Врывайся
                </Link>
                <Link href="/login" className="btn-action btn-action-outline">
                  Уже в движе
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Filters ────────────────────────────────── */}
        <Suspense fallback={<div className="h-14 animate-pulse bg-muted/50 rounded-2xl" />}>
          <FeedFilters />
        </Suspense>

        {/* ── Feed ───────────────────────────────────── */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-card">
              <p className="font-heading text-3xl text-lime/60">ТУТ ПОКА ТИХО</p>
              <p className="text-muted-foreground text-sm mt-3">
                Запусти первый движ — создай пост
              </p>
              <Link href="/create" className="btn-action mt-6 inline-flex">
                Запостить
              </Link>
            </div>
          ) : (
            posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-semibold">
      {icon}
      <span className="text-foreground font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
