import { FeedHero } from "@/components/feed/feed-hero";
import { PulseDayCard } from "@/components/feed/pulse-day-card";
import { FeedTipsSection } from "@/components/feed/feed-tips-card";
import { FeedPostEventTile } from "@/components/feed/feed-post-event-tile";
import { RefSurface } from "@/components/surface/ref-surface";
import { RefSectionHeader } from "@/components/surface/ref-ui";
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
    <RefSurface className="max-w-lg mx-auto">
      <FeedHero />

      {pulse?.metrics && <PulseDayCard metrics={pulse.metrics} />}

      <FeedTipsSection
        tip={tipHighlight ? {
          title: tipHighlight.title,
          subtitle: highlightSubtitle(tipHighlight),
        } : undefined}
      />

      <RefSectionHeader
        title="Лента событий"
        action={displayPosts.length > 0 ? `${displayPosts.length} карточек` : undefined}
      />

      {displayPosts.length === 0 ? (
        <div className="ref-card text-center py-14 px-4">
          <p className="text-[22px] font-extrabold text-[var(--ref-ink)]">Пока тихо</p>
          <p className="text-[13px] ref-body mt-2">Запиши действие или зайди в «Рядом»</p>
        </div>
      ) : (
        displayPosts.map((post) => (
          <FeedPostEventTile key={post.id} post={post} />
        ))
      )}
    </RefSurface>
  );
}
