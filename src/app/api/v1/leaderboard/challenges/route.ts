import { getChallengeLeaderboard } from "@/lib/actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope =
    scopeParam === "global" ? "global" : scopeParam === "friends" ? "friends" : "local";
  const city = searchParams.get("city") ?? session?.city ?? "Москва";

  if (scope === "friends" && !session?.id) {
    return jsonOk({ scope, city, challenges: [] });
  }

  const challenges = await getChallengeLeaderboard(
    scope === "local" ? city : undefined,
    scope,
    session?.id,
  );

  return jsonOk({ scope, city, challenges });
}
