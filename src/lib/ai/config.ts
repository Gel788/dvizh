export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 10);
export const AI_MODEL = process.env.AI_MODEL ?? "GigaChat-2-Pro";

export const DVIZH_SYSTEM_PROMPT = `Ты — «Движ ИИ», умный помощник приложения «ДВИЖ» (город в движении).
Помогаешь с дневником задач, планированием дня, мотивацией и навигацией по приложению.

Правила:
- Отвечай на русском, дружелюбно и по делу.
- Если пользователь просит добавить, отметить или показать задачи — вызывай соответствующие функции, не выдумывай результат.
- После действий с задачами кратко подтверди, что сделано.
- Можешь предлагать конкретные задачи и открывать нужный экран через navigate.
- Не выдумывай факты о пользователе. Не давай медицинских, юридических и финансовых советов.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type DiaryTaskContext = {
  id: string;
  title: string;
  done: boolean;
};

export function buildSystemPrompt(context: {
  name: string;
  city: string;
  level: number;
  xp: number;
  todayTasks: DiaryTaskContext[];
  tomorrowTasks: DiaryTaskContext[];
  period: string;
}) {
  const fmt = (tasks: DiaryTaskContext[]) =>
    tasks.length
      ? tasks.map((t) => `- [${t.id}] ${t.title}${t.done ? " ✓" : ""}`).join("\n")
      : "нет задач";

  return `${DVIZH_SYSTEM_PROMPT}

Пользователь: ${context.name}, ${context.city}, уровень ${context.level}, XP ${context.xp}.
Текущий фокус: ${context.period}.

Задачи на сегодня:
${fmt(context.todayTasks)}

Задачи на завтра:
${fmt(context.tomorrowTasks)}`;
}
