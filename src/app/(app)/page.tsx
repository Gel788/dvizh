import Link from "next/link";
import { Suspense } from "react";
import { FeedHero } from "@/components/feed/feed-hero";
import { PulseDayCard } from "@/components/feed/pulse-day-card";
import { FeedTipsCard } from "@/components/feed/feed-tips-card";
import { FeedPostEventTile } from "@/components/feed/feed-post-event-tile";
import { RefSurface } from "@/components/surface/ref-surface";
import { getFeedPosts } from "@/lib/actions";
import { getCuratedFeed } from "@/lib/diary-actions";
import { getPulseDay } from "@/lib/pulse-service";
import { getSession } from "@/lib/auth";
import { CITY_COORDS } from "@/lib/geo";
import type { PostType } from "@prisma/client";
import type { FeedHighlight } from "@/components/feed/feed-highlight-card";

function highlightSubtitle(h: FeedHighlight): string | undefined {
  switch (h.kind) {
    case "challenge_stat":
      return h.label;
    case "sponsor":
      return h.reward;
    case "duel":
      return h.participants.join(" · ");
    case "milestone":
      return `Уровень ${h.level}`;
    default:
      return undefined;
  }
}

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

  const [curated, posts, pulse] = await Promise.all([
    getCuratedFeed(city, session?.id).catch(() => null),
    getFeedPosts({
      feed: feedMode,
      city,
      type: (params.type as PostType | "ALL") ?? "ALL",
      district: params.district,
      tag: params.tag,
      ...(feedMode === "nearby"
        ? {
            radiusKm: Number(params.radius ?? 10),
            userLat: session?.lat ?? coords.lat,
            userLng: session?.lng ?? coords.lng,
          }
        : {}),
    }),
    getPulseDay(city, session?.id).catch(() => null),
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

  const seen = new Set(curatedPosts.map((p) => p.id));
  const displayPosts = [
    ...curatedPosts,
    ...posts.filter((p) => !seen.has(p.id)),
  ];

  const tipHighlight = curated?.highlights?.[0];

  return (
    <RefSurface className="max-w-2xl mx-auto xl:max-w-3xl pb-32">
      <FeedHero />

      {pulse?.metrics && (
        <div className="mt-1">
          <PulseDayCard metrics={pulse.metrics} city={pulse.city} />
        </div>
      )}

      {tipHighlight && (
        <FeedTipsCard
          tips={[{
            title: tipHighlight.title,
            subtitle: highlightSubtitle(tipHighlight),
          }]}
        />
      )}

      <section className="pt-4">
        {displayPosts.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[22px] font-extrabold text-[var(--ref-ink,#33251f)]">Лента событий</h2>
            <span className="ref-card rounded-full px-3 py-1 text-[11px] font-extrabold ref-muted">
              {displayPosts.length} карточек
            </span>
          </div>
        )}

        {displayPosts.length === 0 ? (
          <div className="ref-card text-center py-16 px-6 mt-2">
            <p className="text-[22px] font-extrabold text-[var(--ref-ink,#33251f)]">Пока тихо</p>
            <p className="text-sm ref-muted mt-2">Запиши действие или зайди в «Рядом»</p>
            <Link
              href="/nearby"
              className="inline-flex mt-5 rounded-full px-5 py-2.5 text-sm font-extrabold text-[var(--ref-ink,#33251f)]"
              style={{ background: "linear-gradient(135deg, #f0cf2c, #98c84a)" }}
            >
              Смотреть рядом
            </Link>
          </div>
        ) : (
          displayPosts.map((post) => (
            <FeedPostEventTile key={post.id} post={post} />
          ))
        )}
      </section>
    </RefSurface>
  );
}
