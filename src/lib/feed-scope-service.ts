import type { AnnouncementCategory, PostType } from "@prisma/client";

export type FeedScope = "all" | "following" | "nearby" | "district" | "city" | "global";

type FeedPostLike = {
  type: PostType | string;
  featuredInFeed?: boolean;
  tags?: string;
  category?: AnnouncementCategory | string | null;
  authorId?: string;
  feedScore?: number;
  _count: { likes: number; comments: number; going: number; reposts: number };
};

export function engagementTotal(post: FeedPostLike): number {
  return post._count.likes + post._count.comments + post._count.going + post._count.reposts;
}

export function isSignificantPost(post: FeedPostLike): boolean {
  if (post.featuredInFeed) return true;
  if ((post.tags ?? "").includes("sponsored")) return true;

  const engagement = engagementTotal(post);

  if (post.type === "ANNOUNCEMENT") {
    if (post.category === "EVENT" || post.category === "MEETUP" || post.category === "SPORT") {
      return true;
    }
    return engagement >= 3 || post._count.going >= 2;
  }
  if (post.type === "CHALLENGE") {
    return engagement >= 2 || post._count.going >= 1;
  }
  if (post.type === "ACTIVITY") {
    return engagement >= 6;
  }
  return false;
}

export function isMundanePublicPost(post: FeedPostLike): boolean {
  return !isSignificantPost(post);
}

/** Nearby: ~15–20% будничных public постов между significant. */
export function mixNearbyPosts<T extends FeedPostLike>(posts: T[], mundaneRatio = 0.18): T[] {
  const significant = posts.filter(isSignificantPost);
  const mundane = posts.filter(isMundanePublicPost);
  if (!mundane.length) return significant.length ? significant : posts;
  if (!significant.length) return mundane.slice(0, Math.max(3, Math.round(mundane.length * mundaneRatio)));

  const maxMundane = Math.max(1, Math.round((significant.length * mundaneRatio) / (1 - mundaneRatio)));
  const pickedMundane = mundane.slice(0, maxMundane);
  const interval = Math.max(4, Math.round(1 / mundaneRatio));

  const merged: T[] = [];
  let si = 0;
  let mi = 0;
  let pos = 0;

  while (si < significant.length || mi < pickedMundane.length) {
    if (pos > 0 && pos % interval === 0 && mi < pickedMundane.length) {
      merged.push(pickedMundane[mi++]);
    } else if (si < significant.length) {
      merged.push(significant[si++]);
    } else if (mi < pickedMundane.length) {
      merged.push(pickedMundane[mi++]);
    }
    pos += 1;
  }
  return merged;
}

export function filterSignificantOnly<T extends FeedPostLike>(posts: T[]): T[] {
  const significant = posts.filter(isSignificantPost);
  return significant.length ? significant : posts.slice(0, 12);
}

export function pickHeroTop3<T extends FeedPostLike>(posts: T[]): T[] {
  const picked: T[] = [];
  const seenAuthors = new Set<string>();

  for (const post of posts) {
    const authorId = post.authorId;
    if (authorId) {
      if (seenAuthors.has(authorId)) continue;
      seenAuthors.add(authorId);
    }
    picked.push(post);
    if (picked.length >= 3) break;
  }
  return picked;
}

export function applyFeedScopeMix<T extends FeedPostLike>(posts: T[], scope?: FeedScope): T[] {
  if (!scope || scope === "following" || scope === "all") return posts;
  if (scope === "nearby") return mixNearbyPosts(posts);
  if (scope === "district" || scope === "city" || scope === "global") {
    return filterSignificantOnly(posts);
  }
  return posts;
}
