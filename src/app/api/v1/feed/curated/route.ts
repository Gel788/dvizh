import { getCuratedFeed } from "@/lib/diary-actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";
import { getCached, setCached } from "@/lib/api/feed-cache";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? session?.city ?? "Москва";
  const cacheKey = `curated:v2:${city}:${session?.id ?? "anon"}`;

  const cached = getCached<Awaited<ReturnType<typeof getCuratedFeed>>>(cacheKey);
  if (cached) return jsonOk(cached);

  const feed = await getCuratedFeed(city, session?.id);
  setCached(cacheKey, feed);
  return jsonOk(feed);
}
