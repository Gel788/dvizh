import { addMediaItem } from "@/lib/api/social-create-service";
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
