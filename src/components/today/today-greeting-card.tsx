"use client";

import { motion } from "motion/react";
import { levelInfo } from "@/components/profile/profile-data";

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
      className="ref-card rounded-[24px] p-4 border-[#dfecc9]"
      style={{
        background: "linear-gradient(135deg, #fffdf8 0%, #f0fbdf 100%)",
      }}
    >
      <div className="space-y-3">
        <div>
          <p className="text-[22px] font-extrabold leading-tight text-[var(--ref-ink,#33251f)]">
            {greeting()}, {who} ☀️
          </p>
          <p className="text-[13px] font-medium ref-body mt-2 leading-relaxed max-w-md">
            {subtitle ?? "Дела с точным временем — в блоке «Сегодня ещё». Закрывай приоритет первым."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold text-[var(--ref-ink,#33251f)]">{li.into} XP</span>
          <span className="text-[12px] font-semibold ref-muted">до {li.level + 1} уровня</span>
          <div className="ref-progress-track flex-1">
            <motion.div
              className="ref-progress-fill"
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
