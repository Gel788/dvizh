import { getFeedPosts, getChallengeLeaderboard, type FeedFilters } from "@/lib/actions";
import { getCuratedFeed, getDiaryBundle, type DiaryBundle } from "@/lib/diary-actions";
import { getNearbyPayload, type NearbyOptions } from "@/lib/api/nearby-service";
import { v1Fetch } from "@/lib/api/v1-server";
import type { SessionUser } from "@/lib/auth";
import type { FeedScope } from "@/lib/feed-scope-service";
import type { PostType } from "@prisma/client";

function scopeToApiFeed(scope: FeedScope): string {
  if (scope === "following") return "following";
  if (scope === "nearby") return "nearby";
  if (scope === "district") return "district";
  if (scope === "global") return "global";
  return "city";
}

function scopeToCurated(scope: FeedScope): "city" | "district" | "global" {
  if (scope === "global") return "global";
  if (scope === "district") return "district";
  return "city";
}

export async function webGetCuratedFeed(
  city: string,
  session: SessionUser | null,
  scope: FeedScope,
  district?: string,
) {
  const curatedScope = scopeToCurated(scope);
  const fromApi = await v1Fetch<Awaited<ReturnType<typeof getCuratedFeed>>>(
    "/feed/curated",
    { query: { city, scope: curatedScope, district } },
  );
  if (fromApi) return fromApi;
  return getCuratedFeed(city, session?.id, curatedScope, district);
}

export async function webGetFeedPosts(
  filters: FeedFilters,
  session: SessionUser | null,
) {
  const feed = scopeToApiFeed(filters.feed ?? "all");
  const fromApi = await v1Fetch<{ posts: Awaited<ReturnType<typeof getFeedPosts>> }>(
    "/feed",
    {
      query: {
        city: filters.city,
        feed,
        type: filters.type,
        district: filters.district,
        tag: filters.tag,
        radiusKm: filters.radiusKm,
        lat: filters.userLat,
        lng: filters.userLng,
      },
    },
  );
  if (fromApi?.posts) return fromApi.posts;
  return getFeedPosts(filters, session);
}

export async function webGetNearbyPayload(
  session: SessionUser | null,
  options: NearbyOptions = {},
) {
  const fromApi = await v1Fetch<Awaited<ReturnType<typeof getNearbyPayload>>>("/nearby", {
    query: {
      city: options.city,
      lat: options.lat ?? undefined,
      lng: options.lng ?? undefined,
      radiusKm: options.radiusKm,
      district: options.district,
    },
  });
  if (fromApi) return fromApi;
  return getNearbyPayload(session, options);
}

export async function webGetChallengeLeaderboard(
  city: string | undefined,
  scope: "local" | "global" | "friends" | "district" | "mine",
  userId?: string,
  district?: string,
) {
  const apiScope =
    scope === "local" ? "city" : scope;
  const fromApi = await v1Fetch<{ challenges: Awaited<ReturnType<typeof getChallengeLeaderboard>> }>(
    "/leaderboard/challenges",
    { query: { scope: apiScope, city, district } },
  );
  if (fromApi?.challenges) return fromApi.challenges;
  return getChallengeLeaderboard(city, scope, userId, district);
}

export async function webGetDiaryBundle(userId: string, tzOffset?: number): Promise<DiaryBundle> {
  const fromApi = await v1Fetch<{ diary: DiaryBundle }>("/profile/diary", {
    query: { tzOffset },
  });
  if (fromApi?.diary) return fromApi.diary;
  return getDiaryBundle(userId, tzOffset);
}

export type { FeedScope, FeedFilters, PostType };
