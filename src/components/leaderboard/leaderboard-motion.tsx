"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Crown, Target, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MotionEnter } from "@/components/ui/motion-surface";
import { spring } from "@/lib/motion-spring";
import { cn } from "@/lib/utils";

type Challenge = {
  id: string;
  goalCount: number;
  post: {
    id: string;
    title: string | null;
    content: string;
    author: { name: string; avatar: string | null };
  };
  participants: { progress: number }[];
  _count: { participants: number };
};

type Props = {
  challenges: Challenge[];
  scope: "local" | "global";
};

export function LeaderboardMotion({ challenges, scope }: Props) {
  const top3 = challenges.slice(0, 3);
  const rest = challenges.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-20", "h-28", "h-14"];
  const podiumColors = ["text-foreground/50", "text-lime", "text-heat"];

  return (
    <>
      {top3.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
          className="mb-8 flex items-end justify-center gap-3"
        >
          {podiumOrder.map((ch, idx) => {
            if (!ch) return null;
            const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.bouncy, delay: idx * 0.08 }}
                className="flex flex-col items-center gap-3 flex-1 max-w-[140px]"
              >
                <Link href={`/post/${ch.post.id}`} className="flex flex-col items-center gap-2 cursor-pointer group text-center t-card-press">
                  {rank === 1 && <Crown className="h-5 w-5 text-lime" />}
                  <Avatar className={cn("ring-2 transition-all group-hover:scale-105", rank === 1 ? "h-14 w-14 ring-lime/40" : rank === 2 ? "h-11 w-11 ring-white/15" : "h-10 w-10 ring-heat/30")}>
                    <AvatarImage src={ch.post.author.avatar ?? undefined} />
                    <AvatarFallback className="bg-muted text-xs font-bold">{ch.post.author.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <p className="text-[11px] font-bold truncate max-w-[120px] leading-tight">{ch.post.title ?? "Челлендж"}</p>
                  <p className={cn("font-heading text-lg leading-none flex items-center gap-1", podiumColors[idx])}>
                    <Users className="h-3.5 w-3.5" />
                    {ch._count.participants}
                  </p>
                </Link>
                <div className={cn("w-full rounded-t-xl border border-white/[0.07] bg-white/[0.04] flex items-center justify-center", podiumHeights[idx])}>
                  <span className={cn("font-heading text-3xl", podiumColors[idx])}>{rank}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div className="space-y-2">
        {(top3.length < 3 ? challenges : rest).map((ch, idx) => {
          const rank = top3.length >= 3 ? idx + 4 : idx + 1;
          const leader = ch.participants[0];
          const progress = leader?.progress ?? 0;
          const goal = ch.goalCount || 100;
          return (
            <MotionEnter key={ch.id} index={idx}>
              <Link href={`/post/${ch.post.id}`} className="card-surface block p-4 cursor-pointer group t-card-press">
                <div className="flex items-center gap-4">
                  <span className="font-heading text-xl text-muted-foreground/40 w-8 text-center shrink-0">{rank}</span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-heat/10 text-heat">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-lime transition-colors">
                      {ch.post.title ?? ch.post.content.slice(0, 80)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ch.post.author.name} · {ch._count.participants} участников
                    </p>
                    {leader && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={Math.min(100, (progress / goal) * 100)} className="h-1.5 flex-1 progress-lime" />
                        <span className="text-[10px] text-muted-foreground shrink-0">лидер {progress}/{goal}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </MotionEnter>
          );
        })}
        {challenges.length === 0 && (
          <div className="card-surface p-8 text-center text-muted-foreground text-sm t-reveal">
            Пока нет челленджей — создай первый в разделе «Рядом»
          </div>
        )}
      </div>
    </>
  );
}
