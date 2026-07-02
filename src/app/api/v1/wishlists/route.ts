import {
  createWishlistRecord,
  listWishlistsForViewer,
} from "@/lib/wishlist-service";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  title: string;
  occasion?: string;
  eventAt?: string | null;
  visibility?: string;
  items?: { title: string; price?: string; link?: string; comment?: string }[];
};

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? session.id;
    const data = await listWishlistsForViewer(userId, session.id, session.username);
    return jsonOk(data);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.title?.trim()) return jsonError("Укажите название списка", 400, "INVALID_BODY");
    const data = await createWishlistRecord(session.id, body);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
