import { getFeedPosts, type FeedFilters } from "@/lib/actions";
import { pickHeroTop3 } from "@/lib/feed-scope-service";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";
import { parseCoord, resolveOrigin } from "@/lib/geo";
import type { PostType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city") ?? session?.city ?? "Москва";
  const origin = resolveOrigin(session, city, {
    lat: parseCoord(searchParams.get("lat")),
    lng: parseCoord(searchParams.get("lng")),
  });

  const typeParam = searchParams.get("type");
  const feed = (searchParams.get("feed") as FeedFilters["feed"]) ?? "city";
  const radiusRaw = searchParams.get("radiusKm") ?? searchParams.get("radius");
  const district = searchParams.get("district") ?? session?.district ?? undefined;

  const filters: FeedFilters = {
    city,
    type: (typeParam as PostType | "ALL") ?? "ALL",
    district: feed === "district" ? district : searchParams.get("district") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    feed: feed === "all" ? "city" : feed,
    userLat: origin.lat,
    userLng: origin.lng,
    radiusKm:
      feed === "nearby" || radiusRaw
        ? parseCoord(radiusRaw) ?? 10
        : undefined,
  };

  const posts = await getFeedPosts(filters, session);
  const heroes = pickHeroTop3(posts);
  return jsonOk({
    posts,
    heroes,
    origin: { lat: origin.lat, lng: origin.lng },
    hasGps: origin.hasGps,
  });
}
