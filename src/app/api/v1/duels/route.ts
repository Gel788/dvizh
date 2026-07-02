import { createDuel } from "@/lib/api/social-create-service";
import { listDuelsForUser } from "@/lib/duel-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  title: string;
  description?: string;
  emoji?: string;
  period?: string;
  visibility?: string;
  friendIds?: string[];
  remindersOn?: boolean;
};

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const duels = await listDuelsForUser(session.id);
    return jsonOk({ duels });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.title?.trim()) return jsonError("Укажите название", 400, "INVALID_BODY");
    const data = await createDuel(session, {
      title: body.title,
      description: body.description,
      emoji: body.emoji,
      period: body.period,
      visibility: body.visibility,
      friendIds: body.friendIds ?? [],
      remindersOn: body.remindersOn,
    });
    if ("error" in data && data.error === "MIN_PARTICIPANTS") {
      return jsonError("Нужно минимум 2 участника (вы + друг)", 400, "MIN_PARTICIPANTS");
    }
    if ("error" in data && data.error === "MAX_PARTICIPANTS") {
      return jsonError("Максимум 8 участников", 400, "MAX_PARTICIPANTS");
    }
    return jsonOk(data, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
