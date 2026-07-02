"use client";

import { motion } from "motion/react";
import { levelInfo, rankName } from "@/components/profile/profile-data";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

export function TodayGreetingCard({
  xp,
  name,
  subtitle,
}: {
  xp: number;
  name?: string;
  subtitle?: string;
}) {
  const li = levelInfo(xp);
  const who = name?.trim() || "друг";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[22px] border border-lime/15 p-4"
      style={{
        background: "linear-gradient(135deg, rgba(200,255,87,0.12) 0%, rgba(255,176,32,0.08) 48%, rgba(17,17,22,0.95) 100%)",
      }}
    >
      <div className="relative z-10 space-y-3">
        <div>
          <p className="font-heading text-lg leading-tight text-foreground">
            {greeting()}, {who}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md">
            {subtitle ?? "Дела с точным временем — в блоке «Сегодня ещё». Закрывай приоритет первым."}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1.5">
            <span>{li.into} XP · {rankName(li.level)}</span>
            <span className="text-lime/90">{li.need - li.into} XP до {li.level + 1} уровня</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-lime"
              initial={{ width: 0 }}
              animate={{ width: `${li.pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
