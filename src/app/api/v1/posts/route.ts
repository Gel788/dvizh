import { db } from "@/lib/db";
import { parseTags } from "@/lib/geo";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import type { AnnouncementCategory, PostType } from "@prisma/client";

type CreatePostBody = {
  type?: PostType;
  content?: string;
  title?: string;
  city?: string;
  district?: string;
  tags?: string;
  goalCount?: number;
  reward?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<CreatePostBody>(request);
    if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");

    const type = (body.type ?? "ACTIVITY") as PostType;
    const content = String(body.content ?? "").trim();
    const title = String(body.title ?? "").trim() || null;
    const city = String(body.city ?? session.city).trim() || session.city;
    const district = String(body.district ?? "").trim() || null;
    const tags = parseTags(String(body.tags ?? "")).join(",");

    if (!content) return jsonError("Текст обязателен", 400, "EMPTY");

    const post = await db.post.create({
      data: {
        type,
        authorId: session.id,
        title,
        content,
        city,
        district,
        lat: session.lat,
        lng: session.lng,
        tags,
        challenge:
          type === "CHALLENGE"
            ? {
                create: {
                  goalCount: Number(body.goalCount ?? 1),
                  reward: body.reward?.trim() || null,
                },
              }
            : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            verified: true,
            city: true,
            district: true,
          },
        },
        _count: { select: { likes: true, comments: true, going: true, reposts: true } },
      },
    });

    return jsonOk({ post }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
