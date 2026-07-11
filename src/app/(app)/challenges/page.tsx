import { Trophy } from "lucide-react";
import { webGetChallengeLeaderboard } from "@/lib/api/v1-web-services";
import { getSession } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { LeaderboardMotion } from "@/components/leaderboard/leaderboard-motion";
import { SegmentedTabs } from "@/components/layout/v38/segmented-tabs";
import { V38_CHALLENGE_SCOPES, type V38ChallengeScope } from "@/lib/v38-nav";

function parseScope(raw?: string): V38ChallengeScope {
  if (raw === "global" || raw === "friends" || raw === "district" || raw === "mine") return raw;
  if (raw === "local") return "city";
  return "city";
}

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope = parseScope(scopeParam);
  const session = await getSession();
  const city = session?.city ?? "Москва";
  const district = session?.district ?? undefined;

  const apiScope =
    scope === "city" ? "local" : scope;

  const challenges = await webGetChallengeLeaderboard(
    scope === "global" ? undefined : city,
    apiScope,
    session?.id,
    district,
  );

  const scopeTabs = V38_CHALLENGE_SCOPES.map((tab) => ({
    ...tab,
    href: tab.value === "city" ? "/challenges" : `/challenges?scope=${tab.value}`,
  }));

  return (
    <PageShell
      title="Челленджи"
      description="Сезоны, рейтинги и твои активные вызовы"
      icon={<Trophy className="h-6 w-6" />}
      accent="lime"
      action={<SegmentedTabs tabs={scopeTabs} active={scope} className="max-w-xl" />}
    >
      <LeaderboardMotion challenges={challenges} scope={scope === "global" ? "global" : "local"} />
    </PageShell>
  );
}
