import {
  completeDiaryTaskForUser,
  createDiaryTaskForUser,
} from "@/lib/diary-actions";
import { db } from "@/lib/db";
import type { DiaryPeriod } from "@prisma/client";

const PERIODS = ["today", "tomorrow", "week", "month", "year", "dream"] as const;
export type AiPeriod = (typeof PERIODS)[number];

const PERIOD_DB: Record<AiPeriod, DiaryPeriod> = {
  today: "TODAY",
  tomorrow: "TOMORROW",
  week: "WEEK",
  month: "MONTH",
  year: "YEAR",
  dream: "DREAM",
};

export type AiClientAction =
  | { type: "sync_diary" }
  | { type: "navigate"; screen: string };

export type AiToolResult = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
  actions?: AiClientAction[];
};

export const DVIZH_AI_FUNCTIONS = [
  {
    name: "add_tasks",
    description:
      "Добавить одну или несколько задач в дневник. Используй, когда пользователь просит записать, добавить или запланировать задачи.",
    parameters: {
      type: "object",
      properties: {
        texts: {
          type: "array",
          items: { type: "string" },
          description: "Тексты задач",
        },
        period: {
          type: "string",
          enum: PERIODS,
          description: "Период: today — сегодня, tomorrow — завтра, week/month/year/dream",
        },
        hashtag: {
          type: "string",
          description: "Опциональный хештег без #",
        },
      },
      required: ["texts", "period"],
    },
  },
  {
    name: "complete_task",
    description:
      "Отметить задачу выполненной. Передавай task_id из контекста или title — название задачи.",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "ID задачи из контекста" },
        title: { type: "string", description: "Название задачи, если ID неизвестен" },
        period: {
          type: "string",
          enum: PERIODS,
          description: "Период поиска задачи, по умолчанию today",
        },
      },
    },
  },
  {
    name: "list_tasks",
    description: "Получить список задач пользователя за период.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: PERIODS,
          description: "Период дневника",
        },
        include_done: {
          type: "boolean",
          description: "Включать выполненные задачи",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "navigate",
    description:
      "Открыть экран приложения: feed — лента, dvizh — карта рядом, diary — дневник, challenges — челленджи, profile — профиль.",
    parameters: {
      type: "object",
      properties: {
        screen: {
          type: "string",
          enum: ["feed", "dvizh", "diary", "challenges", "profile", "map"],
        },
      },
      required: ["screen"],
    },
  },
] as const;

function normalizePeriod(raw: unknown): AiPeriod {
  const p = String(raw ?? "today").toLowerCase();
  return PERIODS.includes(p as AiPeriod) ? (p as AiPeriod) : "today";
}

async function findTaskByTitle(userId: string, period: AiPeriod, title: string) {
  const needle = title.trim().toLowerCase();
  if (!needle) return null;

  const tasks = await db.diaryTask.findMany({
    where: { userId, period: PERIOD_DB[period], done: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 30,
    select: { id: true, title: true },
  });

  return (
    tasks.find((t) => t.title.toLowerCase() === needle) ??
    tasks.find((t) => t.title.toLowerCase().includes(needle)) ??
    null
  );
}

export async function executeAiTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<AiToolResult> {
  switch (name) {
    case "add_tasks": {
      const texts = Array.isArray(args.texts)
        ? args.texts.map((t) => String(t).trim()).filter(Boolean)
        : [];
      const period = normalizePeriod(args.period);
      if (!texts.length) {
        return { ok: false, message: "Не указаны тексты задач" };
      }

      const created = await createDiaryTaskForUser(userId, {
        text: texts.join("\n"),
        period,
        visibility: "private",
        hashtag: typeof args.hashtag === "string" ? args.hashtag : undefined,
        multiLine: texts.length > 1,
      });

      return {
        ok: true,
        message: `Добавлено задач: ${created.length}`,
        data: {
          tasks: created.map((t) => ({ id: t.id, text: t.text, period })),
        },
        actions: [{ type: "sync_diary" }, { type: "navigate", screen: "diary" }],
      };
    }

    case "complete_task": {
      const period = normalizePeriod(args.period);
      let taskId = typeof args.task_id === "string" ? args.task_id.trim() : "";

      if (!taskId && typeof args.title === "string") {
        const found = await findTaskByTitle(userId, period, args.title);
        taskId = found?.id ?? "";
      }

      if (!taskId) {
        return { ok: false, message: "Задача не найдена — уточни название или id" };
      }

      const result = await completeDiaryTaskForUser(userId, taskId);
      if (result.xpGain === 0 && !result.levelUp) {
        const exists = await db.diaryTask.findFirst({
          where: { id: taskId, userId },
          select: { done: true, title: true },
        });
        if (!exists) return { ok: false, message: "Задача не найдена" };
        if (exists.done) {
          return { ok: true, message: `«${exists.title}» уже выполнена`, actions: [{ type: "sync_diary" }] };
        }
        return { ok: false, message: "Не удалось отметить задачу" };
      }

      return {
        ok: true,
        message: `Задача выполнена${result.xpGain ? `, +${result.xpGain} XP` : ""}`,
        data: { xpGain: result.xpGain, levelUp: result.levelUp, newLevel: result.newLevel },
        actions: [{ type: "sync_diary" }],
      };
    }

    case "list_tasks": {
      const period = normalizePeriod(args.period);
      const includeDone = args.include_done === true;

      const tasks = await db.diaryTask.findMany({
        where: {
          userId,
          period: PERIOD_DB[period],
          ...(includeDone ? {} : { done: false }),
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 20,
        select: { id: true, title: true, done: true, hashtag: true },
      });

      return {
        ok: true,
        message: `Задач: ${tasks.length}`,
        data: {
          period,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            done: t.done,
            tag: t.hashtag ?? undefined,
          })),
        },
      };
    }

    case "navigate": {
      const screen = String(args.screen ?? "").toLowerCase();
      const allowed = ["feed", "dvizh", "diary", "challenges", "profile", "map"];
      if (!allowed.includes(screen)) {
        return { ok: false, message: "Неизвестный экран" };
      }
      return {
        ok: true,
        message: `Открываю ${screen}`,
        actions: [{ type: "navigate", screen }],
      };
    }

    default:
      return { ok: false, message: `Неизвестная функция: ${name}` };
  }
}

export function parseToolArguments(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}
