import { db } from "@/lib/db";
import { buildSystemPrompt, type ChatMessage } from "./config";
import { isAiConfigured, runAiAgent, type LlmMessage } from "./providers";
import { executeAiTool, type AiClientAction } from "./tools";

export type AiUsageInfo = {
  enabled: boolean;
  used: number;
  limit: number;
  remaining: number;
  provider?: string | null;
  model?: string | null;
};

export type AiChatResult = {
  reply: string;
  usage: AiUsageInfo;
  actions: AiClientAction[];
};

export function isAiEnabled() {
  return isAiConfigured();
}

export async function getAiUsage(_userId: string): Promise<AiUsageInfo> {
  const enabled = isAiEnabled();
  const model =
    process.env.GIGACHAT_MODEL?.trim() || process.env.AI_MODEL?.trim() || "GigaChat-2-Pro";
  return {
    enabled,
    used: 0,
    limit: 0,
    remaining: enabled ? 999 : 0,
    provider: "gigachat",
    model,
  };
}

async function loadDiaryContext(userId: string) {
  const [user, profile, todayTasks, tomorrowTasks] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, city: true },
    }),
    db.userProfile.findUnique({ where: { userId }, select: { level: true, xp: true } }),
    db.diaryTask.findMany({
      where: { userId, period: "TODAY" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 15,
      select: { id: true, title: true, done: true },
    }),
    db.diaryTask.findMany({
      where: { userId, period: "TOMORROW", done: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 8,
      select: { id: true, title: true, done: true },
    }),
  ]);

  return {
    name: user?.name ?? "друг",
    city: user?.city ?? "Москва",
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    todayTasks: todayTasks.map((t) => ({ id: t.id, title: t.title, done: t.done })),
    tomorrowTasks: tomorrowTasks.map((t) => ({ id: t.id, title: t.title, done: t.done })),
    period: "сегодня",
  };
}

export async function chatWithAi(
  userId: string,
  message: string,
  history: ChatMessage[] = [],
): Promise<AiChatResult> {
  if (!isAiEnabled()) {
    throw new Error("Движ ИИ временно недоступен");
  }

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Сообщение должно быть от 1 до 2000 символов");
  }

  const ctx = await loadDiaryContext(userId);
  const system = buildSystemPrompt(ctx);

  const messages: LlmMessage[] = [
    { role: "system", content: system },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: trimmed },
  ];

  const { reply, actions } = await runAiAgent(messages, async (name, args) => {
    const result = await executeAiTool(userId, name, args);
    return {
      message: result.ok ? result.message : `Ошибка: ${result.message}`,
      actions: result.actions,
    };
  });

  const next = await getAiUsage(userId);
  return { reply, usage: next, actions };
}
