import { haversineKm } from "@/lib/geo";

export type ScoredFeedPost<T> = T & { feedScore: number };

type PostCounts = {
  likes: number;
  comments: number;
  going: number;
  reposts: number;
};

type ScorePostInput = {
  createdAt: Date;
  featuredInFeed?: boolean;
  featuredBoost?: number;
  type?: string;
  lat?: number | null;
  lng?: number | null;
  authorId?: string;
  _count: PostCounts;
};

export type FeedScoreContext = {
  viewerId?: string;
  followingAuthorIds?: Set<string>;
  userLat?: number;
  userLng?: number;
  feed?: "all" | "following" | "nearby" | "district" | "city" | "global";
};

export function scoreFeedPost(post: ScorePostInput, ctx: FeedScoreContext = {}): number {
  const ageHours = (Date.now() - post.createdAt.getTime()) / 3_600_000;
  const freshness = Math.max(0, Math.min(1, 1 - ageHours / 72));

  const engagement =
    post._count.likes * 2 +
    post._count.comments * 3 +
    post._count.going * 4 +
    post._count.reposts * 2;
  const socialMomentum = Math.min(1, engagement / 40);

  let actionability = 0.45;
  if (post.type === "ANNOUNCEMENT" || post.type === "EVENT") actionability = 0.85;
  if (post.type === "CHALLENGE") actionability = 0.75;
  if (post.type === "ACTIVITY") actionability = 0.55;

  let visual = post.type === "MEDIA" || post.type === "ACTIVITY" ? 0.7 : 0.5;

  let relevance = 0.5;
  if (ctx.viewerId && post.authorId && ctx.followingAuthorIds?.has(post.authorId)) {
    relevance = 0.9;
  }
  if (ctx.feed === "following") relevance = Math.max(relevance, 0.82);

  let proximityBoost = 0;
  if (
    ctx.feed === "nearby" &&
    ctx.userLat != null &&
    ctx.userLng != null &&
    post.lat != null &&
    post.lng != null
  ) {
    const km = haversineKm(ctx.userLat, ctx.userLng, post.lat, post.lng);
    proximityBoost = Math.max(0, 0.18 * (1 - km / 12));
  }

  const featuredBoost = post.featuredInFeed ? 0.12 + (post.featuredBoost ?? 0) / 500 : 0;

  const score =
    freshness * 0.28 +
    socialMomentum * 0.24 +
    relevance * 0.22 +
    actionability * 0.12 +
    visual * 0.08 +
    proximityBoost +
    featuredBoost;

  return Math.round(score * 1000) / 1000;
}

export function rankFeedPosts<T extends ScorePostInput>(
  posts: T[],
  ctx: FeedScoreContext = {},
): ScoredFeedPost<T>[] {
  return posts
    .map((post) => ({ ...post, feedScore: scoreFeedPost(post, ctx) }))
    .sort((a, b) => b.feedScore - a.feedScore || b.createdAt.getTime() - a.createdAt.getTime());
}
