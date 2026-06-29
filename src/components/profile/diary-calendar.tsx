"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { tagColor } from "./profile-data";

export function DiaryCalendar() {
  const { calendar, loadCalendar } = useDiary();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");

  const { year, month, days } = calendar;
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: offset + daysInMonth }, (_, i) => i - offset + 1);

  const monthLabel = new Date(year, month).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const selectedData = days[selected];
  const today = new Date().toISOString().slice(0, 10);

  const searchHits = useMemo(() => {
    if (!search.trim()) return new Set<string>();
    const q = search.toLowerCase();
    const hits = new Set<string>();
    for (const [date, data] of Object.entries(days)) {
      if (data.tasks.some((t) => t.title.toLowerCase().includes(q))) hits.add(date);
    }
    return hits;
  }, [search, days]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    startTransition(async () => {
      await loadCalendar(d.getFullYear(), d.getMonth());
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по выполненным задачам…"
        className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm"
      />

      <div className={cn("card-surface p-4", pending && "opacity-60")}>
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer" aria-label="Предыдущий месяц">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="font-heading text-sm font-bold capitalize">{monthLabel}</p>
          <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer" aria-label="Следующий месяц">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-2 text-center">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day < 1 || day > daysInMonth) return <div key={i} />;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const info = days[key];
            const isToday = key === today;
            const isSelected = key === selected;
            const highlight = searchHits.has(key);
            const hasBirthday = info?.birthdays?.length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "aspect-square rounded-lg p-1 text-xs font-bold relative transition-colors cursor-pointer",
                  isSelected && "ring-2 ring-lime",
                  isToday && "border border-lime/40",
                  highlight && "bg-lime/10",
                  hasBirthday && "bg-heat/10",
                  !info && "text-muted-foreground/50",
                )}
              >
                {day}
                {hasBirthday && <span className="absolute top-0.5 right-0.5 text-[8px]">🎂</span>}
                {info && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {info.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="w-1 h-1 rounded-full" style={{ background: tagColor(tag) }} />
                    ))}
                    {info.hasDone && <span className="w-1 h-1 rounded-full bg-good" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          {new Date(selected).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {selectedData?.birthdays?.map((b) => (
          <div key={b} className="card-surface p-3 border-l-2 border-heat/50">
            <p className="text-xs font-bold text-heat">🎂 День рождения</p>
            <p className="text-sm font-semibold mt-0.5">{b}</p>
          </div>
        ))}
        {!selectedData?.tasks.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">На этот день ничего не запланировано</p>
        ) : (
          selectedData.tasks.map((t) => (
            <div key={t.id} className={cn("card-surface p-3.5", t.done && "opacity-60")}>
              <p className={cn("font-semibold text-sm", t.done && "line-through")}>{t.title}</p>
              {t.hashtag && (
                <span className="text-[11px] font-bold mt-1 inline-block" style={{ color: tagColor(t.hashtag) }}>
                  #{t.hashtag}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
