import { getChallengeLeaderboard } from "@/lib/actions";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope =
    scopeParam === "global"
      ? "global"
      : scopeParam === "friends"
        ? "friends"
        : scopeParam === "district"
          ? "district"
          : scopeParam === "mine"
            ? "mine"
            : scopeParam === "city"
              ? "local"
              : "local";
  const city = searchParams.get("city") ?? session?.city ?? "Москва";
  const district = searchParams.get("district") ?? session?.district ?? undefined;

  if (scope === "friends" && !session?.id) {
    return jsonOk({ scope, city, district, challenges: [] });
  }

  const challenges = await getChallengeLeaderboard(
    scope === "local" || scope === "district" ? city : undefined,
    scope,
    session?.id,
    district,
  );

  return jsonOk({ scope, city, district, challenges });
}
