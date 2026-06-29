import Link from "next/link";
import { Suspense } from "react";
import { FeedFilters } from "@/components/feed/feed-filters";
import { PostCard } from "@/components/feed/post-card";
import { CuratedAchievementCard } from "@/components/feed/curated-achievement-card";
import { FeedDigest } from "@/components/feed/feed-digest";
import { FeedHighlightCard } from "@/components/feed/feed-highlight-card";
import { FeedHero } from "@/components/feed/feed-hero";
import { AppContent } from "@/components/layout/app-content";
import { DesktopRail } from "@/components/layout/desktop-rail";
import { getFeedPosts } from "@/lib/actions";
import { getCuratedFeed } from "@/lib/diary-actions";
import { getSession } from "@/lib/auth";
import { CITY_COORDS } from "@/lib/geo";
import type { PostType } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  feed?: string; city?: string; type?: string;
  district?: string; tag?: string; radius?: string;
}>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  const city = params.city ?? session?.city ?? "Москва";
  const coords = CITY_COORDS[city] ?? CITY_COORDS["Москва"];
  const feedMode = (params.feed as "all" | "following" | "nearby") ?? "all";

  const [curated, posts] = await Promise.all([
    getCuratedFeed(city, session?.id).catch(() => null),
    getFeedPosts({
      feed: feedMode,
      city,
      type: (params.type as PostType | "ALL") ?? "ALL",
      district: params.district,
      tag: params.tag,
      radiusKm: Number(params.radius ?? 10),
      userLat: session?.lat ?? coords.lat,
      userLng: session?.lng ?? coords.lng,
    }),
  ]);

  const curatedPostsRaw = curated?.items
    .filter((i): i is Extract<typeof i, { kind: "post" }> => i.kind === "post")
    .map((i) => i.post) ?? [];

  const curatedPosts: typeof curatedPostsRaw = [];
  const curatedSeen = new Set<string>();
  for (const post of curatedPostsRaw) {
    if (curatedSeen.has(post.id)) continue;
    curatedSeen.add(post.id);
    curatedPosts.push(post);
  }

  const curatedAchievements = curated?.items
    .filter((i): i is Extract<typeof i, { kind: "achievement" }> => i.kind === "achievement")
    .map((i) => i.activity) ?? [];

  const seen = new Set(curatedPosts.map((p) => p.id));
  const displayPosts = [
    ...curatedPosts,
    ...posts.filter((p) => !seen.has(p.id)),
  ];

  const cityScope = curated?.digest.scopes?.city;
  const railStats = cityScope
    ? [
        { value: cityScope.stats[0]?.value ?? "0", label: "челл." },
        { value: cityScope.stats[1]?.value ?? "0", label: "ивентов" },
        { value: String(displayPosts.length), label: "в ленте" },
      ]
    : undefined;

  return (
    <div className="dvizh-grid min-h-full">
      <AppContent
        mainClassName="max-w-2xl xl:max-w-none mx-auto xl:mx-0 w-full"
        rail={
          <DesktopRail
            city={city}
            username={session?.username}
            stats={railStats}
          />
        }
      >
        <FeedHero city={city} />

        <Suspense fallback={<div className="h-12 animate-pulse bg-muted/50 rounded-full" />}>
          <FeedFilters />
        </Suspense>

        {(curated?.digest.scopes || curated?.highlights?.length || curatedAchievements.length > 0) && (
          <div className="feed-bento mt-4 mb-4 space-y-3 xl:space-y-0">
            {curated?.digest.scopes && (
              <FeedDigest city={city} scopes={curated.digest.scopes} />
            )}
            <div className="space-y-3 min-w-0">
              {curated?.highlights?.slice(0, 2).map((h, i) => (
                <FeedHighlightCard key={`${h.kind}-${i}`} item={h} index={i} />
              ))}
              {curatedAchievements.slice(0, 1).map((a) => (
                <CuratedAchievementCard key={a.id} activity={a} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {curated?.highlights && curated.highlights.length > 2 && (
            <div className="xl:hidden space-y-3">
              {curated.highlights.slice(2).map((h, i) => (
                <FeedHighlightCard key={`${h.kind}-m-${i}`} item={h} index={i + 2} />
              ))}
            </div>
          )}
          {curatedAchievements.slice(1, 2).map((a) => (
            <div key={a.id} className="xl:hidden">
              <CuratedAchievementCard activity={a} />
            </div>
          ))}
          {displayPosts.length === 0 && !curated?.highlights?.length ? (
            <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-card">
              <p className="font-heading text-3xl text-lime/60">ПОКА ТИХО</p>
              <p className="text-muted-foreground text-sm mt-3">Запиши действие или зайди в «Рядом»</p>
              <Link href="/nearby" className="btn-action mt-6 inline-flex">Смотреть рядом</Link>
            </div>
          ) : (
            displayPosts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
              />
            ))
          )}
        </div>
      </AppContent>
    </div>
  );
}
