import type { DiaryPeriod, DiaryTask } from "@/components/profile/profile-data";

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayKey() {
  return dayKey(new Date());
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameDayIso(iso: string | undefined, day: Date) {
  if (!iso) return false;
  return isSameDay(new Date(iso), day);
}

export function formatPlannerDayLabel(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function formatWeekday(d: Date) {
  const w = d.toLocaleDateString("ru-RU", { weekday: "long" });
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function formatDateLong(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function mondayOf(d: Date) {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() - (base.getDay() === 0 ? 6 : base.getDay() - 1));
}

function hasScheduledTime(task: DiaryTask) {
  if (task.hasTime) return true;
  if (task.reminderAt) return true;
  if (!task.dueDate) return false;
  const d = new Date(task.dueDate);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

export function tasksForPlannerDay(
  tasks: Record<DiaryPeriod, DiaryTask[]>,
  dayKeyStr: string,
): DiaryTask[] {
  const day = parseDayKey(dayKeyStr);
  const today = todayKey();

  if (dayKeyStr === today) {
    const todayTasks = [...(tasks.today ?? [])];
    const seen = new Set(todayTasks.map((t) => t.id));
    for (const list of Object.values(tasks)) {
      for (const t of list) {
        if (seen.has(t.id)) continue;
        if (t.dueDate && isSameDayIso(t.dueDate, day)) {
          todayTasks.push(t);
          seen.add(t.id);
        }
      }
    }
    return todayTasks;
  }

  const result: DiaryTask[] = [];
  const seen = new Set<string>();
  for (const list of Object.values(tasks)) {
    for (const t of list) {
      if (seen.has(t.id)) continue;
      if (t.dueDate && isSameDayIso(t.dueDate, day)) {
        result.push(t);
        seen.add(t.id);
      }
    }
  }
  return result;
}

export function splitDayTasks(all: DiaryTask[], day: Date) {
  const active = all.filter((t) => !t.done);
  const priority = active.filter((t) => t.priority);
  const timed = active.filter(
    (t) => isSameDayIso(t.dueDate, day) && hasScheduledTime(t) && !t.priority,
  );
  const regular = active.filter(
    (t) => !t.priority && !(isSameDayIso(t.dueDate, day) && hasScheduledTime(t)),
  );
  const done = all.filter((t) => t.done);
  return { priority, timed, regular, done };
}
