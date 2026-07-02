"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERIODS, type DiaryPeriod, type DiaryTask } from "./profile-data";

const VIS_TEXT = { private: "Только я", friends: "Друзья", all: "Все" } as const;
const VIS_CHIP = {
  private: "bg-white/[0.06] text-muted-foreground",
  friends: "bg-ice/15 text-ice",
  all: "bg-lime/12 text-lime",
} as const;

function formatTime(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return null;
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
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

function TaskBadges({ task, periodXp }: { task: DiaryTask; periodXp: number }) {
  const vis = task.visibility ?? "private";
  const time = formatTime(task.scheduledAt ?? task.reminderAt ?? task.dueDate);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", VIS_CHIP[vis])}>
        {VIS_TEXT[vis]}
      </span>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFB020]/12 text-[#FFB020]">
        {periodXp} XP
      </span>
      {task.streak != null && task.streak >= 2 && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-heat/12 text-heat">
          🔥 {task.streak}
        </span>
      )}
      {task.askProof && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-muted-foreground">
          фото
        </span>
      )}
      {time && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-muted-foreground">
          {time}
        </span>
      )}
      {task.tag && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-muted-foreground">
          #{task.tag}
        </span>
      )}
    </div>
  );
}

type TaskRowProps = {
  task: DiaryTask;
  index: number;
  period: DiaryPeriod;
  xpPopId: string | null;
  onToggle: (id: string) => void;
  showIndex?: boolean;
};

export function TaskRowV24({ task, index, period, xpPopId, onToggle, showIndex = true }: TaskRowProps) {
  const periodXp = PERIODS[period].xp;

  return (
    <div className="card-surface rounded-[20px] flex items-start gap-2.5 p-3.5 relative">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="w-7 h-7 mt-0.5 rounded-[10px] border-2 border-white/[0.14] shrink-0 hover:border-lime/40 active:scale-95 transition-all cursor-pointer"
        aria-label="Выполнить"
      />
      <div className="w-1.5 shrink-0" aria-hidden />
      {showIndex && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime/15 text-[11px] font-extrabold text-lime border border-lime/25">
          {index + 1}
        </span>
      )}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="font-bold text-[15px] leading-snug">{task.text}</p>
        <TaskBadges task={task} periodXp={periodXp} />
      </div>
      <span className="text-sm font-extrabold text-[#FFB020] shrink-0 pt-1">{periodXp} XP</span>
      <AnimatePresence>
        {xpPopId === task.id && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: -18 }}
            exit={{ opacity: 0, y: -36 }}
            className="absolute right-12 top-1 font-heading text-lg text-[#FFB020] pointer-events-none"
          >
            +{periodXp} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TaskRowDone({ task, onToggle }: { task: DiaryTask; onToggle?: (id: string) => void }) {
  const meta = [
    task.tag ? `#${task.tag}` : null,
    task.visibility ? VIS_TEXT[task.visibility] : "Только я",
    task.streak && task.streak >= 2 ? `🔥 ${task.streak}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="card-surface rounded-[20px] flex items-center gap-3 p-3.5 opacity-70">
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
        {meta && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{meta}</p>}
      </div>
    </div>
  );
}
