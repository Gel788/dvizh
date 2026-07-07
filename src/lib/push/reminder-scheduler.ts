import { db } from "@/lib/db";
import { notifyUser } from "@/lib/push/push-service";

const TICK_MS = 60_000;
/** Окно доставки — если тик сервера опоздал, напоминание всё равно уйдёт. */
const WINDOW_MS = 5 * 60_000;
let started = false;

function effectiveReminderAt(row: {
  reminderAt: Date | null;
  scheduledAt: Date | null;
  hasTime: boolean;
}): Date | null {
  if (row.reminderAt) return row.reminderAt;
  if (row.hasTime && row.scheduledAt) return row.scheduledAt;
  return null;
}

export async function processDueReminders() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const [tasks, events] = await Promise.all([
    db.diaryTask.findMany({
      where: {
        done: false,
        reminderPushedAt: null,
        OR: [
          { reminderAt: { lte: now, gte: windowStart } },
          { AND: [{ hasTime: true }, { scheduledAt: { lte: now, gte: windowStart } }, { reminderAt: null }] },
        ],
      },
      select: { id: true, userId: true, title: true, reminderAt: true, scheduledAt: true, hasTime: true },
      take: 200,
    }),
    db.personalCalendarEvent.findMany({
      where: {
        reminderPushedAt: null,
        OR: [
          { reminderAt: { lte: now, gte: windowStart } },
          { AND: [{ hasTime: true }, { scheduledAt: { lte: now, gte: windowStart } }, { reminderAt: null }] },
        ],
      },
      select: { id: true, userId: true, title: true, reminderAt: true, scheduledAt: true, hasTime: true },
      take: 200,
    }),
  ]);

  let pushedTasks = 0;
  let pushedEvents = 0;

  for (const task of tasks) {
    const at = effectiveReminderAt(task);
    if (!at || at > now || at < windowStart) continue;
    await notifyUser(task.userId, {
      type: "TASK_REMINDER",
      title: task.title,
      body: "Пора выполнить",
      link: `/diary/task/${task.id}`,
    });
    await db.diaryTask.update({ where: { id: task.id }, data: { reminderPushedAt: now } });
    pushedTasks += 1;
  }

  for (const ev of events) {
    const at = effectiveReminderAt(ev);
    if (!at || at > now || at < windowStart) continue;
    await notifyUser(ev.userId, {
      type: "EVENT_REMINDER",
      title: ev.title,
      body: "Скоро событие",
      link: "/diary",
    });
    await db.personalCalendarEvent.update({ where: { id: ev.id }, data: { reminderPushedAt: now } });
    pushedEvents += 1;
  }

  return { tasks: pushedTasks, events: pushedEvents, scanned: { tasks: tasks.length, events: events.length } };
}

export function startReminderScheduler() {
  if (started || process.env.DISABLE_REMINDER_SCHEDULER === "1") return;
  started = true;
  const tick = () => {
    void processDueReminders().catch((e) => {
      console.error("[reminders]", e);
    });
  };
  tick();
  setInterval(tick, TICK_MS);
}
