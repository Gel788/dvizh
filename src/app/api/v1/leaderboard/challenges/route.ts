import { getChallengeLeaderboard } from "@/lib/actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") === "global" ? "global" : "local";
  const city = searchParams.get("city") ?? session?.city ?? "Москва";

  const challenges = await getChallengeLeaderboard(
    scope === "local" ? city : undefined,
    scope
  );

  return jsonOk({ scope, city, challenges });
}
