"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiaryCalendar } from "./diary-calendar";
import { useDiary } from "./diary-context";
import { AiAssistantButton, AiAssistantSheet } from "./ai-assistant-sheet";
import { TodayGreetingCard } from "@/components/today/today-greeting-card";
import { PERIODS, levelInfo, rankName, tagColor, type DiaryPeriod } from "./profile-data";
import { TaskRowV24, TaskRowDone } from "./diary-task-card";
import { DiarySectionHeader } from "./diary-planner-header";
import {
  formatPlannerDayLabel, splitDayTasks, tasksForPlannerDay,
} from "@/lib/diary-day-utils";

const VIS_LABELS = { private: "🔒", friends: "👥", all: "🌍" } as const;

function formatDue(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatRemind(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function checklistProgress(raw?: string) {
  if (!raw || raw === "[]") return null;
  try {
    const items = JSON.parse(raw) as string[];
    if (!items.length) return null;
    return `${items.length} пунктов`;
  } catch {
    return raw.includes("\n") ? `${raw.split("\n").filter(Boolean).length} пунктов` : null;
  }
}

type DiarySectionProps = {
  mode?: "profile" | "today";
  userName?: string;
};

export function DiarySection({ mode = "profile", userName }: DiarySectionProps) {
  const {
    xp, period, setPeriod, tasks, toggleTask, diaryView, setDiaryView,
    reorderTasks, periodFrames, effectivePlannerDayKey, plannerDay, plannerIsToday,
  } = useDiary();
  const [xpPop, setXpPop] = useState<{ id: string; amount: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const isTodayPage = mode === "today";
  const li = levelInfo(xp);
  const allList = tasks[period];
  const list = allList.filter((t) => !t.done);
  const doneList = allList.filter((t) => t.done);
  const allDone = list.length === 0 && doneList.length > 0;

  const plannerTasks = tasksForPlannerDay(tasks, effectivePlannerDayKey);
  const daySplit = splitDayTasks(plannerTasks, plannerDay);
  const dayLabel = formatPlannerDayLabel(plannerDay);

  function handleToggle(id: string) {
    const task = [...list, ...plannerTasks, ...daySplit.done].find((t) => t.id === id);
    if (!task) return;
    if (!task.done) {
      const xpPeriod = isTodayPage && period === "today" ? period : period;
      setXpPop({ id, amount: PERIODS[xpPeriod].xp });
      setTimeout(() => setXpPop(null), 1000);
    }
    toggleTask(id);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = list.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    reorderTasks(period, ids);
    setDragId(null);
  }

  const hint = (() => {
    const pending = daySplit.priority.length + daySplit.timed.length + daySplit.regular.length;
    if (pending === 0) {
      return plannerIsToday
        ? "Добавь дело кнопкой «Создать» — начни с простого действия."
        : `На ${dayLabel} дел пока нет.`;
    }
    if (plannerIsToday && daySplit.priority.length > 0) {
      return `Сегодня в приоритете ${daySplit.priority.length} дел.`;
    }
    return `${pending} дел на ${dayLabel}.`;
  })();

  function renderDaySections() {
    return (
      <div className="space-y-4">
        {isTodayPage && plannerIsToday && (
          <TodayGreetingCard xp={xp} name={userName} />
        )}

        <div className="rounded-2xl border border-lime/15 bg-lime/[0.06] px-3.5 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{hint}</p>
        </div>

        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-extrabold flex items-center gap-1.5">
            <span aria-hidden>🎯</span> Приоритет
          </h2>
          <span className="text-xs font-bold text-lime hover:underline cursor-pointer">
            Все задачи →
          </span>
        </div>
        {daySplit.priority.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">Нет приоритетных дел.</p>
        ) : (
          <div className="space-y-2">
            {daySplit.priority.map((task, i) => (
              <TaskRowV24 key={task.id} task={task} index={i} period="today" xpPopId={xpPop?.id ?? null} onToggle={handleToggle} />
            ))}
          </div>
        )}

        {daySplit.timed.length > 0 && (
          <>
            <DiarySectionHeader title="Сегодня ещё" />
            <div className="space-y-2">
              {daySplit.timed.map((task, i) => (
                <TaskRowV24 key={task.id} task={task} index={i} period="today" xpPopId={xpPop?.id ?? null} onToggle={handleToggle} />
              ))}
            </div>
          </>
        )}

        {daySplit.regular.length > 0 && (
          <>
            <DiarySectionHeader title="Задачи" />
            <div className="space-y-2">
              {daySplit.regular.map((task, i) => (
                <TaskRowV24 key={task.id} task={task} index={i} period="today" xpPopId={xpPop?.id ?? null} onToggle={handleToggle} />
              ))}
            </div>
          </>
        )}

        {daySplit.priority.length === 0 && daySplit.timed.length === 0 && daySplit.regular.length === 0 && (
          <div className="text-center py-14 text-muted-foreground">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-heading text-lg text-lime/80">Пока пусто</p>
          </div>
        )}

        {daySplit.done.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-muted-foreground px-1">Выполнено · {daySplit.done.length}</p>
            {daySplit.done.map((task) => (
              <TaskRowDone key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const periodListContent = (
    <>
      {!isTodayPage && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {(Object.keys(PERIODS) as DiaryPeriod[]).map((key) => {
            const cnt = tasks[key].filter((t) => !t.done).length;
            const on = period === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={cn(
                  "shrink-0 flex flex-col items-start gap-0.5 px-3.5 py-2 rounded-[14px] text-left border transition-colors cursor-pointer min-w-[92px]",
                  on ? "text-lime-foreground border-transparent" : "bg-card border-white/[0.07] text-muted-foreground",
                )}
                style={on ? { background: PERIODS[key].color, color: key === "today" || key === "tomorrow" ? "#0A0A0F" : "#fff" } : undefined}
              >
                <span className="flex items-center gap-2 text-[13px] font-bold">
                  {PERIODS[key].label}
                  <span className={cn("text-[11px] min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center font-extrabold", on ? "bg-black/20" : "bg-white/[0.06]")}>
                    {cnt}
                  </span>
                </span>
                {periodFrames[key] && (
                  <span className={cn("text-[10px] font-semibold leading-tight", on ? "opacity-80" : "opacity-60")}>
                    {periodFrames[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {allDone ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-heading text-lg text-lime/80">Всё закрыто!</p>
          <p className="text-sm mt-2">На этот период задач не осталось.</p>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-heading text-lg text-lime/80">Пока пусто</p>
          <p className="text-sm mt-2">Нажми + и добавь первую задачу на {PERIODS[period].label.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((task, i) => {
            const col = task.tag ? tagColor(task.tag) : undefined;
            return (
              <motion.div
                key={task.id}
                layout
                draggable={!task.done}
                onDragStart={() => setDragId(task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(task.id)}
                className={cn("card-surface flex items-center gap-3 p-3.5 relative", task.done && "opacity-50", dragId === task.id && "ring-1 ring-lime/40")}
              >
                {!task.done && <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />}
                <span className="w-[22px] h-[22px] rounded-full bg-white/[0.06] grid place-items-center text-[11px] font-extrabold text-muted-foreground shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-[15px] leading-snug", task.done && "line-through text-muted-foreground")}>{task.text}</p>
                  {task.note && !task.done && <p className="text-xs text-muted-foreground/80 mt-1">{task.note}</p>}
                  <div className="flex flex-wrap gap-2 items-center mt-1 text-xs text-muted-foreground">
                    {task.visibility && task.visibility !== "private" && <span className="text-[10px]">{VIS_LABELS[task.visibility]}</span>}
                    {task.tag && <span className="font-bold px-2 py-0.5 rounded-md" style={{ color: col, background: `${col}22` }}>#{task.tag}</span>}
                    {formatDue(task.dueDate) && <span>📅 {formatDue(task.dueDate)}</span>}
                    {formatRemind(task.reminderAt) && <span>⏰ {formatRemind(task.reminderAt)}</span>}
                    {checklistProgress(task.checklist) && <span className="text-ice">{checklistProgress(task.checklist)}</span>}
                    {task.streak && <span className="inline-flex items-center gap-0.5 font-bold text-heat bg-heat/10 px-2 py-0.5 rounded-full">🔥 {task.streak}</span>}
                    {task.isRecurring && <span>🔁</span>}
                    <span>+{PERIODS[period].xp} XP{task.streak ? " · бонус стрика" : ""}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(task.id)}
                  disabled={task.done}
                  className={cn(
                    "w-[27px] h-[27px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer",
                    task.done ? "bg-good border-good" : "border-white/[0.12] bg-card hover:border-lime/40 active:scale-90",
                  )}
                >
                  <Check className={cn("h-3.5 w-3.5 text-white", !task.done && "opacity-0")} strokeWidth={3} />
                </button>
                <AnimatePresence>
                  {xpPop?.id === task.id && (
                    <motion.span
                      initial={{ opacity: 0, y: 6, scale: 0.8 }}
                      animate={{ opacity: 1, y: -20, scale: 1 }}
                      exit={{ opacity: 0, y: -40 }}
                      className="absolute right-4 top-2 font-heading text-lg text-[#FFB020] pointer-events-none"
                    >
                      +{xpPop.amount} XP
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {doneList.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-muted-foreground px-1">Выполнено · {doneList.length}</p>
          {doneList.map((task) => (
            <div key={task.id} className="card-surface flex items-center gap-3 p-3.5 opacity-60">
              <span className="w-[27px] h-[27px] rounded-full bg-good border-2 border-good flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </span>
              <p className="font-semibold text-[15px] line-through text-muted-foreground">{task.text}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <AiAssistantSheet open={aiOpen} onClose={() => setAiOpen(false)} />

      {!isTodayPage && (
        <div className="relative overflow-hidden rounded-[20px] p-4 text-white border border-white/[0.08]"
          style={{ background: "linear-gradient(120deg, rgba(200,255,87,0.12), rgba(17,17,22,0.98))" }}>
          <p className="text-xs font-bold opacity-80">Уровень</p>
          <p className="font-heading text-[38px] leading-none flex items-baseline gap-2">
            {li.level}
            <span className="text-sm font-semibold opacity-70 font-sans">звание</span>
          </p>
          <p className="text-sm font-bold mt-1">{rankName(li.level)}</p>
          <div className="mt-3 h-2 rounded-full bg-white/15 max-w-[255px] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-lime"
              animate={{ width: `${li.pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="text-[11px] opacity-75 mt-2">{li.into} / {li.need} XP · до уровня {li.level + 1}</p>
          {periodFrames.today && (
            <p className="text-[11px] opacity-70 mt-1">Сегодня · {periodFrames.today}</p>
          )}
        </div>
      )}

      {!isTodayPage && diaryView === "list" && <AiAssistantButton onClick={() => setAiOpen(true)} />}

      {!isTodayPage && (
        <div className="flex gap-2">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDiaryView(v)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                diaryView === v ? "bg-lime text-lime-foreground border-lime" : "border-white/[0.08] text-muted-foreground",
              )}
            >
              {v === "list" ? "Список" : "Календарь"}
            </button>
          ))}
        </div>
      )}

      {diaryView === "calendar" ? (
        <DiaryCalendar />
      ) : isTodayPage && period === "today" ? (
        renderDaySections()
      ) : isTodayPage && period !== "today" ? (
        periodListContent
      ) : period === "today" ? (
        renderDaySections()
      ) : (
        periodListContent
      )}
    </div>
  );
}
