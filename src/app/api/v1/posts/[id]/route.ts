import { getPostById, addComment } from "@/lib/api/social-service";
import { getSessionFromRequest, requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = await getSessionFromRequest(request);
  const data = await getPostById(id, session);
  if (!data) return jsonError("Пост не найден", 404, "NOT_FOUND");
  return jsonOk(data);
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await requireSessionFromRequest(request);
    const body = await readJson<{ content?: string }>(request);
    if (!body?.content?.trim()) return jsonError("Текст обязателен", 400, "EMPTY");
    const result = await addComment(id, body.content, session);
    if ("error" in result) return jsonError(result.error!, 400, "EMPTY");
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
