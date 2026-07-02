"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { PERIODS, levelInfo, type DiaryPeriod } from "./profile-data";
import {
  dayKey, formatDateLong, formatWeekday, mondayOf, tasksForPlannerDay, todayKey,
} from "@/lib/diary-day-utils";

const WEEK_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type Props = {
  onCreate: () => void;
  onViewChanged: (view: "list" | "calendar") => void;
  onPeriodChanged: (period: DiaryPeriod) => void;
};

export function DiaryPlannerHeader({ onCreate, onViewChanged, onPeriodChanged }: Props) {
  const {
    xp, period, diaryView, tasks, calendar,
    effectivePlannerDayKey, plannerDay, plannerIsToday, selectPlannerDay,
  } = useDiary();
  const [dateOpen, setDateOpen] = useState(false);

  const li = levelInfo(xp);
  const today = useMemo(() => new Date(), []);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = mondayOf(plannerDay);
  const dayTasks = tasksForPlannerDay(tasks, effectivePlannerDayKey);
  const total = dayTasks.length;
  const doneCount = dayTasks.filter((t) => t.done).length;
  const progress = total === 0 ? 0 : doneCount / total;
  const dayMap = calendar.days as Record<string, { events?: unknown[] }>;

  function hasItemsForDay(d: Date) {
    const key = dayKey(d);
    return Boolean(dayMap[key]) || tasksForPlannerDay(tasks, key).length > 0;
  }

  function shiftWeek(delta: number) {
    const next = new Date(plannerDay);
    next.setDate(next.getDate() + delta);
    void selectPlannerDay(dayKey(next));
  }

  function pickDate(value: string) {
    if (!value) return;
    void selectPlannerDay(value);
    setDateOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="card-surface p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-lime">ДВЖ</p>
            <p className="text-[11px] font-semibold text-muted-foreground -mt-0.5">Твой ритм — твоя жизнь</p>
            <h1 className="font-heading text-[26px] leading-tight tracking-tight mt-1">{formatWeekday(plannerDay)}</h1>
            <button
              type="button"
              onClick={() => setDateOpen((v) => !v)}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {formatDateLong(plannerDay)}
              <CalendarDays className="h-4 w-4 text-lime" />
            </button>
            {dateOpen && (
              <div className="mt-2">
                <input
                  type="date"
                  value={effectivePlannerDayKey}
                  onChange={(e) => pickDate(e.target.value)}
                  className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm"
                />
              </div>
            )}
            {!plannerIsToday && (
              <button
                type="button"
                onClick={() => void selectPlannerDay(todayKey())}
                className="mt-2 text-xs font-bold text-lime hover:underline cursor-pointer"
              >
                Вернуться к сегодня
              </button>
            )}
          </div>

          <Link
            href="/notifications"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Уведомления"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Link>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="rounded-full border border-lime/25 bg-lime/10 px-2.5 py-1 text-[10px] font-extrabold text-lime">
              LVL {li.level}
            </span>
            <div className="relative h-12 w-12">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden>
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-white/[0.08]" />
                <circle
                  cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
                  strokeLinecap="round"
                  className="text-lime transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center leading-none">
                <span className="text-sm font-black">{total === 0 ? "—" : doneCount}</span>
                {total > 0 && <span className="text-[9px] font-bold text-muted-foreground">/{total}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftWeek(-7)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Предыдущая неделя"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex flex-1 gap-1">
            {WEEK_SHORT.map((label, i) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const key = dayKey(d);
              const isToday = d.getTime() === todayDate.getTime();
              const isSelected = key === effectivePlannerDayKey;
              const hasItems = hasItemsForDay(d);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => void selectPlannerDay(key)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-lime border-lime text-lime-foreground"
                      : isToday
                        ? "border-lime/45 bg-card"
                        : "border-white/[0.08] bg-card hover:border-white/[0.14]",
                  )}
                >
                  <p className={cn("text-[10px] font-bold", isSelected ? "text-lime-foreground/80" : "text-muted-foreground")}>{label}</p>
                  <p className="text-sm font-black">{d.getDate()}</p>
                  {hasItems && (
                    <span
                      className={cn(
                        "mx-auto mt-1 block h-1.5 w-1.5 rounded-full",
                        isSelected ? "bg-lime-foreground" : "bg-lime",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => shiftWeek(7)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Следующая неделя"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="w-full rounded-2xl bg-lime px-4 py-3.5 text-left hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-foreground/10">
            <Plus className="h-5 w-5 text-lime-foreground" />
          </span>
          <span className="flex-1">
            <span className="block font-heading text-base text-lime-foreground">Создать</span>
            <span className="block text-xs font-semibold text-lime-foreground/70">дело, событие, список…</span>
          </span>
          <ChevronRight className="h-5 w-5 text-lime-foreground/70" />
        </div>
      </button>

      <div className="flex gap-2">
        {(["list", "calendar"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChanged(v)}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
              diaryView === v ? "bg-lime text-lime-foreground border-lime" : "border-white/[0.08] text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "list" ? "Список" : "Календарь"}
          </button>
        ))}
      </div>

      {diaryView === "list" && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {(Object.keys(PERIODS) as DiaryPeriod[]).map((key) => {
            const cnt = tasks[key].filter((t) => !t.done).length;
            const on = period === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPeriodChanged(key)}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-xl text-[13px] font-bold border transition-colors cursor-pointer",
                  on ? "text-lime-foreground border-transparent" : "bg-card border-white/[0.07] text-muted-foreground",
                )}
                style={on ? { background: PERIODS[key].color, color: "#0A0A0F" } : undefined}
              >
                {PERIODS[key].label} · {cnt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DiarySectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h3 className="font-heading text-lg">{title}</h3>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="text-xs font-bold text-lime cursor-pointer">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
