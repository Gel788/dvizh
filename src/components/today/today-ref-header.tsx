"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useDiary } from "@/components/profile/diary-context";
import { levelInfo } from "@/components/profile/profile-data";

export function TodayRefHeader() {
  const { xp } = useDiary();
  const li = levelInfo(xp);

  return (
    <header className="flex items-center gap-2.5">
      <div className="ref-logo-box shrink-0" aria-hidden>
        Д
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[22px] font-extrabold leading-none tracking-tight text-[var(--ref-ink)]">
          ДВЖ
        </p>
        <p className="text-[10.5px] font-bold ref-muted mt-0.5">Твой ритм — твоя жизнь</p>
      </div>
      <div className="ref-card flex items-center gap-2 px-2 py-1 rounded-full shrink-0">
        <div className="text-left leading-tight">
          <p className="text-[11px] font-extrabold text-[var(--ref-ink)]">LVL {li.level}</p>
          <p className="text-[10px] font-bold ref-muted">{xp} XP</p>
        </div>
      </div>
      <Link href="/search" className="ref-round-btn shrink-0" aria-label="Поиск">
        <Search className="h-[18px] w-[18px]" />
      </Link>
    </header>
  );
}
