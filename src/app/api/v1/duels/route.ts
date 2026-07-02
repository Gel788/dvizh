import { createDuel } from "@/lib/api/social-create-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  title: string;
  description?: string;
  emoji?: string;
  period?: string;
  visibility?: string;
  friendIds?: string[];
};

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
    });
    return jsonOk(data, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
