"use client";

import { useDiary } from "@/components/profile/diary-context";
import { levelInfo } from "@/components/profile/profile-data";

export function TodayRefHeader() {
  const { xp } = useDiary();
  const li = levelInfo(xp);

  return (
    <header className="flex items-center gap-2.5">
      <div className="ref-logo-box shrink-0" aria-hidden>Д</div>
      <div className="flex-1 min-w-0">
        <p className="text-[25px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--ref-ink)]">ДВЖ</p>
        <p className="text-[10.5px] font-bold ref-muted">Твой ритм — твоя жизнь</p>
      </div>
      <div
        className="ref-card flex items-center rounded-full py-[5px] pl-1.5 pr-2.5 shrink-0"
        style={{ boxShadow: "0 9px 20px rgba(70,51,32,0.07)" }}
      >
        <div className="w-[29px] h-[29px] rounded-[10px] bg-[#fff7dc] grid place-items-center text-sm font-extrabold text-[var(--ref-ink)]">
          {li.level}
        </div>
        <div className="ml-[7px] text-left leading-tight">
          <p className="text-[11px] font-extrabold text-[var(--ref-ink)]">LVL {li.level}</p>
          <p className="text-[10.5px] font-bold ref-muted">{xp} XP</p>
        </div>
      </div>
    </header>
  );
}
