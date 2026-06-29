"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Trophy, Sparkles, Swords, BarChart3 } from "lucide-react";
import { spring, stagger } from "@/lib/motion-spring";
import { cn } from "@/lib/utils";

export type FeedHighlight =
  | { kind: "milestone"; name: string; username: string; avatar: string | null; level: number; title: string }
  | { kind: "sponsor"; brand: string; reward: string; participants: number; postId: string; title: string }
  | { kind: "duel"; title: string; emoji: string | null; participants: string[]; id: string }
  | { kind: "challenge_stat"; stat: string; label: string; postId: string; title: string };

export function FeedHighlightCard({ item, index = 0 }: { item: FeedHighlight; index?: number }) {
  const wrap = (children: React.ReactNode, className?: string) => (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring.default, delay: index * stagger.normal }}
      whileHover={{ y: -3, transition: spring.snappy }}
      className={cn("t-card-press", className)}
    >
      {children}
    </motion.div>
  );

  if (item.kind === "milestone") {
    return wrap(
      <Link href={`/profile/${item.username}`} className="card-surface flex items-center gap-4 p-4 group cursor-pointer block">
        <div className="w-12 h-12 rounded-2xl bg-lime/10 grid place-items-center shrink-0">
          <Trophy className="h-6 w-6 text-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-lime">Milestone · ур. {item.level}</p>
          <p className="font-bold text-sm mt-0.5 group-hover:text-lime transition-colors">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.title}</p>
        </div>
      </Link>,
    );
  }

  if (item.kind === "sponsor") {
    return wrap(
      <Link href={`/post/${item.postId}`} className="card-surface p-4 group cursor-pointer border-l-2 border-lime/50 block">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-lime shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-lime">Спонсор · {item.brand}</p>
            <p className="font-bold text-sm mt-1 group-hover:text-lime transition-colors">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              🎁 {item.reward} · {item.participants} участников
            </p>
          </div>
        </div>
      </Link>,
    );
  }

  if (item.kind === "duel") {
    return wrap(
      <Link href="/friends?view=duels" className="card-surface p-4 group cursor-pointer block">
        <div className="flex items-start gap-3">
          <Swords className="h-5 w-5 text-heat shrink-0" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-heat">Спор</p>
            <p className="font-bold text-sm mt-0.5">
              {item.emoji ? `${item.emoji} ` : ""}{item.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{item.participants.join(" vs ")}</p>
          </div>
        </div>
      </Link>,
    );
  }

  return wrap(
    <Link href={`/post/${item.postId}`} className="card-surface p-4 group cursor-pointer block">
      <div className="flex items-center gap-4">
        <div className="text-center shrink-0">
          <p className="font-heading text-3xl text-ice t-number-pop">{item.stat}</p>
          <BarChart3 className="h-4 w-4 text-muted-foreground mx-auto mt-1" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ice">Челлендж</p>
          <p className="font-bold text-sm mt-0.5 truncate group-hover:text-lime transition-colors">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      </div>
    </Link>,
  );
}
