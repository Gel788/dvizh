import { createSharedGoalRecord, listSharedGoalsForUser } from "@/lib/shared-goal-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  title: string;
  items?: string[];
  friendIds?: string[];
  eventAt?: string | null;
};

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const goals = await listSharedGoalsForUser(session.id);
    return jsonOk({ goals });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.title?.trim()) return jsonError("Укажите название", 400, "INVALID_BODY");
    try {
      const goal = await createSharedGoalRecord(session.id, {
        title: body.title,
        items: body.items ?? [],
        friendIds: body.friendIds ?? [],
        eventAt: body.eventAt,
      });
      return jsonOk({ goal }, 201);
    } catch (e) {
      if (e instanceof Error && e.message === "MIN_MEMBERS") {
        return jsonError("Добавь хотя бы одного друга", 400, "MIN_MEMBERS");
      }
      if (e instanceof Error && e.message === "MIN_ITEMS") {
        return jsonError("Добавь хотя бы один пункт", 400, "MIN_ITEMS");
      }
      throw e;
    }
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
