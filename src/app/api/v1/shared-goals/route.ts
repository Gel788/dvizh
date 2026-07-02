import { createSharedGoal } from "@/lib/api/social-create-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  title: string;
  items?: string[];
  friendIds?: string[];
};

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.title?.trim()) return jsonError("Укажите название", 400, "INVALID_BODY");
    const data = await createSharedGoal(session, {
      title: body.title,
      items: body.items ?? [],
      friendIds: body.friendIds ?? [],
    });
    return jsonOk(data, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
