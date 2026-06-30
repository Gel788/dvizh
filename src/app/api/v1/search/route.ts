import { searchPlatform } from "@/lib/actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return jsonError("Минимум 2 символа", 400, "QUERY_TOO_SHORT");
  }

  const session = await getSessionFromRequest(request);
  const city = searchParams.get("city") ?? session?.city ?? undefined;
  const results = await searchPlatform(q, city, session?.id);
  return jsonOk(results);
}
