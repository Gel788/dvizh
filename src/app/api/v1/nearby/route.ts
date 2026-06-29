import { getNearbyPayload } from "@/lib/api/nearby-service";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? undefined;
  const payload = await getNearbyPayload(session, city);
  return jsonOk(payload);
}
