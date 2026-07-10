import { addMediaItem } from "@/lib/api/social-create-service";
import { listMediaForUser, listMediaForViewer } from "@/lib/media-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  type?: string;
  title: string;
  status?: string;
  rating?: number;
  review?: string;
  coverUrl?: string;
  pinned?: boolean;
  visibility?: string;
};

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? session.id;
    const data =
      userId === session.id
        ? await listMediaForUser(session.id)
        : await listMediaForViewer(userId, session.id);
    return jsonOk(data);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.title?.trim()) return jsonError("Укажите название", 400, "INVALID_BODY");
    const data = await addMediaItem(session, body);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
