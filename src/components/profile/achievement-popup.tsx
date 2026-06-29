"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { spring } from "@/lib/motion-spring";
import { useDiary } from "./diary-context";

export function AchievementPopup() {
  const { achievementQueue, dismissAchievement } = useDiary();
  const current = achievementQueue[0];
  const remaining = achievementQueue.length - 1;

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismissAchievement, 3200);
    return () => clearTimeout(t);
  }, [current, dismissAchievement]);

  return (
    <AnimatePresence>
      {current && (
        <motion.button
          type="button"
          key={current.title}
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={spring.bouncy}
          onClick={dismissAchievement}
          className="t-panel fixed top-20 left-4 right-4 z-[60] mx-auto max-w-md flex gap-3 items-center p-3.5 rounded-[18px] bg-card border border-white/[0.1] shadow-[0_18px_50px_rgba(0,0,0,0.55)] text-left cursor-pointer"
          data-state="open"
        >
          <div
            className="w-11 h-11 rounded-[13px] grid place-items-center text-2xl shrink-0"
            style={{ background: `${current.color}22` }}
          >
            {current.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-lime">Ачивка открыта</p>
            <p className="font-heading text-sm font-bold leading-tight mt-0.5">{current.title}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{current.description}</p>
          </div>
          {remaining > 0 && (
            <span className="absolute top-2 right-3 text-[10px] font-bold text-muted-foreground">
              ещё {remaining}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
