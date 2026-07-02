"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERIODS, type DiaryPeriod, type DiaryTask } from "./profile-data";

const VIS_TEXT = { private: "Только я", friends: "Друзья", all: "Все" } as const;

function taskMeta(task: DiaryTask) {
  return [
    task.tag ? `#${task.tag}` : null,
    task.visibility ? VIS_TEXT[task.visibility] : "Только я",
    task.streak && task.streak >= 2 ? `🔥 ${task.streak}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function isTodayIso(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function hasScheduledTime(task: DiaryTask) {
  if (task.hasTime) return true;
  if (task.reminderAt) return true;
  if (!task.dueDate) return false;
  const d = new Date(task.dueDate);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

export function splitTodayTasks(all: DiaryTask[]) {
  const active = all.filter((t) => !t.done);
  const priority = active.filter((t) => t.priority);
  const timed = active.filter((t) => isTodayIso(t.dueDate) && hasScheduledTime(t) && !t.priority);
  const regular = active.filter(
    (t) => !t.priority && !(isTodayIso(t.dueDate) && hasScheduledTime(t)),
  );
  const done = all.filter((t) => t.done);
  return { priority, timed, regular, done };
}

type TaskRowProps = {
  task: DiaryTask;
  index: number;
  period: DiaryPeriod;
  xpPopId: string | null;
  onToggle: (id: string) => void;
};

export function TaskRowV24({ task, index, period, xpPopId, onToggle }: TaskRowProps) {
  const meta = taskMeta(task);
  return (
    <div className="card-surface flex items-start gap-2 p-3 relative">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="w-8 h-8 mt-0.5 rounded-full border-2 border-white/[0.12] shrink-0 hover:border-lime/40 active:scale-95 transition-all cursor-pointer"
        aria-label="Выполнить"
      />
      <div className="w-2 shrink-0" aria-hidden />
      <div className="flex-1 min-w-0 py-0.5">
        <p className="font-semibold text-[15px] leading-snug">{task.text}</p>
        {meta && <p className="text-xs font-semibold text-muted-foreground mt-1">{meta}</p>}
      </div>
      <span className="text-sm font-extrabold text-[#FFB020] shrink-0 pt-1">+{PERIODS[period].xp}</span>
      <span className="w-[22px] text-center text-[11px] font-extrabold text-muted-foreground shrink-0 pt-1.5">{index + 1}</span>
      <AnimatePresence>
        {xpPopId === task.id && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: -18 }}
            exit={{ opacity: 0, y: -36 }}
            className="absolute right-10 top-1 font-heading text-lg text-[#FFB020] pointer-events-none"
          >
            +{PERIODS[period].xp} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TaskRowDone({ task, onToggle }: { task: DiaryTask; onToggle?: (id: string) => void }) {
  const meta = taskMeta(task);
  return (
    <div className="card-surface flex items-center gap-3 p-3 opacity-70">
      <button
        type="button"
        onClick={() => onToggle?.(task.id)}
        className="w-[22px] h-[22px] rounded-full bg-good grid place-items-center shrink-0 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
        aria-label="Отменить выполнение"
      >
        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] line-through text-muted-foreground">{task.text}</p>
        {meta && <p className="text-[11px] text-muted-foreground/80">{meta}</p>}
      </div>
    </div>
  );
}
