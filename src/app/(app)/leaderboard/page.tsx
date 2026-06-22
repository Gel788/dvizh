import Link from "next/link";
import { Medal, BadgeCheck, Crown } from "lucide-react";
import { getLeaderboard } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageShell } from "@/components/layout/page-shell";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MOSCOW_DISTRICTS } from "@/lib/geo";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  const { district } = await searchParams;
  const session = await getSession();
  const city = session?.city ?? "Москва";
  const users = await getLeaderboard(city, district);

  const top3 = users.slice(0, 3);
  const rest  = users.slice(3);

  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  const podiumConfig = [
    { rank: 2, height: "h-20", labelClass: "text-foreground/50", rankColor: "text-foreground/50" },
    { rank: 1, height: "h-28", labelClass: "text-lime",          rankColor: "text-lime" },
    { rank: 3, height: "h-14", labelClass: "text-heat",          rankColor: "text-heat" },
  ];

  return (
    <PageShell
      title="РЕЙТИНГ"
      description={`Локальные герои ${city}`}
      icon={<Medal className="h-6 w-6" />}
      accent="lime"
      action={
        <Select defaultValue={district ?? "all"}>
          <SelectTrigger className="w-[172px] h-9 rounded-xl border-white/[0.09] bg-white/[0.04] text-xs font-semibold cursor-pointer">
            <SelectValue placeholder="Район" />
          </SelectTrigger>
          <SelectContent className="border-white/[0.09] bg-popover">
            <SelectItem value="all" className="cursor-pointer text-xs">
              <a href="/leaderboard">Все районы</a>
            </SelectItem>
            {MOSCOW_DISTRICTS.map((d) => (
              <SelectItem key={d} value={d} className="cursor-pointer text-xs">
                <a href={`/leaderboard?district=${encodeURIComponent(d)}`}>{d}</a>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {/* ── Podium top-3 ── */}
      {top3.length >= 3 && (
        <div className="mb-8 flex items-end justify-center gap-2">
          {podiumOrder.map((user, idx) => {
            if (!user) return null;
            const cfg = podiumConfig[idx];
            return (
              <div key={user.id} className="flex flex-col items-center gap-3 flex-1 max-w-[120px]">
                <Link href={`/profile/${user.username}`} className="flex flex-col items-center gap-2 cursor-pointer group">
                  {cfg.rank === 1 && (
                    <Crown className="h-5 w-5 text-lime" />
                  )}
                  <Avatar className={`ring-2 transition-all duration-200 group-hover:scale-105 ${
                    cfg.rank === 1 ? "h-16 w-16 ring-lime/40" :
                    cfg.rank === 2 ? "h-12 w-12 ring-white/15" :
                    "h-10 w-10 ring-heat/30"
                  }`}>
                    <AvatarImage src={user.avatar ?? undefined} />
                    <AvatarFallback className="bg-muted text-xs font-bold">{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-xs font-bold truncate max-w-[100px]">{user.name}</p>
                    <p className={`font-heading text-lg leading-none mt-0.5 ${cfg.rankColor}`}>
                      {user.reputation}
                    </p>
                  </div>
                </Link>
                {/* bar */}
                <div className={`w-full rounded-t-xl border border-white/[0.07] bg-white/[0.04] flex items-center justify-center ${cfg.height}`}>
                  <span className={`font-heading text-3xl ${cfg.labelClass}`}>{cfg.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rest of leaderboard ── */}
      <div className="space-y-2">
        {(top3.length < 3 ? users : rest).map((user, idx) => {
          const rank = top3.length >= 3 ? idx + 4 : idx + 1;
          return (
            <div
              key={user.id}
              className="card-surface flex items-center gap-4 p-4"
            >
              <span className="font-heading text-xl text-muted-foreground/40 w-8 text-center shrink-0 leading-none">
                {rank}
              </span>
              <Link href={`/profile/${user.username}`} className="cursor-pointer shrink-0">
                <Avatar className="h-11 w-11 ring-1 ring-white/[0.07]">
                  <AvatarImage src={user.avatar ?? undefined} />
                  <AvatarFallback className="bg-muted text-xs font-bold">{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${user.username}`}
                  className="font-bold text-sm hover:text-lime transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  {user.name}
                  {user.verified && <BadgeCheck className="h-3.5 w-3.5 text-ice" />}
                </Link>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  @{user.username}{user.district && ` · ${user.district}`}
                </p>
                {user.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {user.badges.map((ub) => (
                      <span key={ub.badge.id} className="chip text-[9px] py-0.5 px-2">
                        {ub.badge.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading text-2xl text-lime leading-none">{user.reputation}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">очки</p>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
