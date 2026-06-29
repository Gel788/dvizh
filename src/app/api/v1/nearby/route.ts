import { getNearbyPayload, parseNearbyQuery } from "@/lib/api/nearby-service";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const payload = await getNearbyPayload(session, parseNearbyQuery(searchParams));
  return jsonOk(payload);
}
