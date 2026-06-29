import { getFeedPosts, type FeedFilters } from "@/lib/actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";
import type { PostType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);

  const typeParam = searchParams.get("type");
  const filters: FeedFilters = {
    city: searchParams.get("city") ?? session?.city ?? undefined,
    type: (typeParam as PostType | "ALL") ?? "ALL",
    district: searchParams.get("district") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    feed: (searchParams.get("feed") as FeedFilters["feed"]) ?? "all",
    radiusKm: searchParams.get("radiusKm")
      ? Number(searchParams.get("radiusKm"))
      : undefined,
    userLat: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
    userLng: searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined,
  };

  const posts = await getFeedPosts(filters, session);
  return jsonOk({ posts });
}
