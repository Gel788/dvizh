import { chatWithAi, getAiUsage } from "@/lib/ai/chat-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import type { ChatMessage } from "@/lib/ai/config";

type ChatBody = {
  message?: string;
  history?: ChatMessage[];
};

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const usage = await getAiUsage(session.id);
    return jsonOk(usage);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<ChatBody>(request);
    if (!body?.message?.trim()) {
      return jsonError("Укажите message", 400, "EMPTY_MESSAGE");
    }

    const result = await chatWithAi(
      session.id,
      body.message,
      Array.isArray(body.history) ? body.history : [],
    );

    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка AI";
    if (msg.includes("UNAUTHORIZED") || msg === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    if (msg.includes("Лимит")) {
      return jsonError(msg, 429, "RATE_LIMIT");
    }
    if (msg.includes("не настроен") || msg.includes("недоступен")) {
      return jsonError(msg, 503, "AI_DISABLED");
    }
    return jsonError(msg, 502, "AI_ERROR");
  }
}
