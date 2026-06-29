"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVEL_REWARDS, levelInfo, rankName } from "./profile-data";
import { useDiary } from "./diary-context";

const CATEGORIES = ["all", "tasks", "streaks", "themes", "social", "level"] as const;

export function AchievementsSection() {
  const { xp, achievements } = useDiary();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const li = levelInfo(xp);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const filtered = useMemo(() => {
    if (cat === "all") return achievements;
    return achievements.filter((a) => a.category === cat);
  }, [achievements, cat]);

  const tiles: number[] = [];
  for (let l = li.level - 1; l <= li.level + 3; l++) {
    if (l >= 1 && l <= 60) tiles.push(l);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Путь уровней</h3>
        <span className="text-xs font-bold text-lime">1–60</span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {tiles.map((l) => {
          const cls = l < li.level ? "passed" : l === li.level ? "cur" : "locked";
          const rw = LEVEL_REWARDS[l] ?? (l === li.level ? "Текущий уровень" : "Награда откроется");
          return (
            <div key={l} className={cn("shrink-0 w-[150px] card-surface p-3.5 relative", cls === "cur" && "ring-2 ring-lime/30", cls === "passed" && "opacity-60")}>
              {cls === "passed" && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-good grid place-items-center">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              )}
              <p className={cn("font-heading text-2xl leading-none", cls === "locked" && "text-muted-foreground/40", cls === "cur" && "text-lime")}>{l}</p>
              <p className="text-xs font-bold mt-1 min-h-[30px] leading-tight">{rankName(l)}</p>
              <p className="text-[11px] text-muted-foreground mt-2 leading-snug">🎁 {rw}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Ачивки</h3>
        <span className="text-xs font-bold text-lime">{unlocked} / {achievements.length}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer", cat === c ? "bg-lime text-lime-foreground border-lime" : "border-white/[0.08] text-muted-foreground")}>
            {{ all: "Все", tasks: "Задачи", streaks: "Стрики", themes: "Темы", social: "Соц", level: "Уровни" }[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto">
        {filtered.slice(0, 40).map((a) => (
          <div key={a.slug} className={cn("card-surface p-3 flex gap-3", !a.unlocked && "opacity-55")}>
            <div className="w-10 h-10 rounded-xl grid place-items-center text-xl shrink-0" style={{ background: `${a.color}22` }}>{a.icon}</div>
            <div className="min-w-0">
              <p className="font-bold text-xs leading-tight">{a.name}</p>
              {a.unlocked ? <p className="text-[11px] text-good font-bold mt-1">Открыто ✓</p> : (
                <>
                  <p className="text-[11px] text-muted-foreground mt-1">{a.progress} / {a.threshold}</p>
                  <div className="h-1 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (a.progress / a.threshold) * 100)}%`, background: a.color }} />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length > 40 && <p className="text-xs text-center text-muted-foreground">+ ещё {filtered.length - 40} ачивок в категории</p>}
    </div>
  );
}
