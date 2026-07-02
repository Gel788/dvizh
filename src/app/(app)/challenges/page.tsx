import Link from "next/link";
import { Trophy } from "lucide-react";
import { getChallengeLeaderboard } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { LeaderboardMotion } from "@/components/leaderboard/leaderboard-motion";
import { cn } from "@/lib/utils";

const SCOPES = [
  { key: "district", label: "Район" },
  { key: "local", label: "Город" },
  { key: "friends", label: "Друзья" },
  { key: "global", label: "Мировые" },
] as const;

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope =
    scopeParam === "global"
      ? "global"
      : scopeParam === "friends"
        ? "friends"
        : scopeParam === "district"
          ? "district"
          : "local";
  const session = await getSession();
  const city = session?.city ?? "Москва";
  const district = session?.district ?? undefined;

  const challenges = await getChallengeLeaderboard(
    scope === "local" || scope === "district" ? city : undefined,
    scope,
    session?.id,
    district,
  );

  return (
    <PageShell
      title="Вызовы"
      description="Топ по числу участников в категории"
      icon={<Trophy className="h-6 w-6" />}
      accent="lime"
      action={
        <div className="flex rounded-xl border border-white/[0.09] overflow-hidden text-xs font-bold t-card-press">
          {SCOPES.map((s) => (
            <Link
              key={s.key}
              href={s.key === "local" ? "/challenges" : `/challenges?scope=${s.key}`}
              className={cn(
                "px-3 py-2 transition-colors whitespace-nowrap",
                scope === s.key ? "bg-lime text-lime-foreground" : "text-muted-foreground hover:bg-white/[0.04]",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      }
    >
      <LeaderboardMotion challenges={challenges} scope={scope === "global" ? "global" : "local"} />
    </PageShell>
  );
}
