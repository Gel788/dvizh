import { getCuratedFeed } from "@/lib/diary-actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? session?.city ?? "Москва";

  const feed = await getCuratedFeed(city, session?.id);
  return jsonOk(feed);
}
