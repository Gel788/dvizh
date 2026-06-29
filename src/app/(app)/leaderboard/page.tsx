import Link from "next/link";
import { Medal } from "lucide-react";
import { getChallengeLeaderboard } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { LeaderboardMotion } from "@/components/leaderboard/leaderboard-motion";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope = scopeParam === "global" ? "global" : "local";
  const session = await getSession();
  const city = session?.city ?? "Москва";

  const challenges = await getChallengeLeaderboard(scope === "local" ? city : undefined, scope);

  return (
    <PageShell
      title="Рейтинг челленджей"
      description="По числу участников · обновление раз в неделю"
      icon={<Medal className="h-6 w-6" />}
      accent="lime"
      action={
        <div className="flex rounded-xl border border-white/[0.09] overflow-hidden text-xs font-bold t-card-press">
          <Link
            href="/leaderboard"
            className={cn("px-4 py-2 transition-colors", scope === "local" ? "bg-lime text-lime-foreground" : "text-muted-foreground hover:bg-white/[0.04]")}
          >
            Локальный
          </Link>
          <Link
            href="/leaderboard?scope=global"
            className={cn("px-4 py-2 transition-colors", scope === "global" ? "bg-lime text-lime-foreground" : "text-muted-foreground hover:bg-white/[0.04]")}
          >
            Глобальный
          </Link>
        </div>
      }
    >
      <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
        Следующее обновление через 4 дня
      </p>

      <LeaderboardMotion challenges={challenges} scope={scope} />
    </PageShell>
  );
}
