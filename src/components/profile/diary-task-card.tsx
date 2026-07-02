"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERIODS, type DiaryPeriod, type DiaryTask } from "./profile-data";

const VIS_TEXT = { private: "Только я", friends: "Друзья", all: "Все" } as const;

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

function TaskMetaLine({ task }: { task: DiaryTask }) {
  const parts = [
    task.tag ? `#${task.tag}` : null,
    VIS_TEXT[task.visibility ?? "private"],
    task.streak != null && task.streak >= 2 ? `🔥 ${task.streak}` : null,
    task.askProof ? "фото-пруф" : null,
    formatTime(task.scheduledAt ?? task.reminderAt ?? task.dueDate),
  ].filter(Boolean);

  return (
    <p className="text-[12px] font-semibold ref-muted mt-1 truncate">
      {parts.join(" · ")}
    </p>
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
    <div className={cn("ref-card flex items-center gap-2.5 p-3 my-1 relative", task.done && "opacity-60")}>
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className={cn(
          "w-7 h-7 shrink-0 rounded-[10px] border-[3px] transition-all cursor-pointer",
          task.done
            ? "bg-[var(--ref-success,#78d39e)] border-[var(--ref-success,#78d39e)] grid place-items-center"
            : "bg-white border-[#dfd3c4] hover:border-[var(--ref-green,#98c84a)]",
        )}
        aria-label={task.done ? "Отменить выполнение" : "Выполнить"}
      >
        {task.done && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </button>
      {showIndex && (
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[10px] bg-[#e9f8d4] text-[13px] font-extrabold text-[var(--ref-green-dark,#5f8d2b)]">
          {index + 1}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-[14.5px] leading-snug text-[var(--ref-ink,#33251f)]", task.done && "line-through")}>
          {task.text}
        </p>
        <TaskMetaLine task={task} />
      </div>
      <span className="ref-xp shrink-0">{periodXp} XP</span>
      <AnimatePresence>
        {xpPopId === task.id && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: -18 }}
            exit={{ opacity: 0, y: -36 }}
            className="absolute right-12 top-1 ref-xp text-lg pointer-events-none"
          >
            +{periodXp} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TaskRowDone({ task, onToggle }: { task: DiaryTask; onToggle?: (id: string) => void }) {
  return (
    <TaskRowV24
      task={task}
      index={0}
      period="today"
      xpPopId={null}
      onToggle={onToggle ?? (() => {})}
      showIndex={false}
    />
  );
}
