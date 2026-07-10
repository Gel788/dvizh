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
  rules?: string;
  deadline?: string;
  isGlobal?: boolean;
  hiddenFromFeed?: boolean;
  lat?: number;
  lng?: number;
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
    const district = String(body.district ?? session.district ?? "").trim() || null;
    const lat = body.lat ?? session.lat;
    const lng = body.lng ?? session.lng;
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
        lat,
        lng,
        tags,
        hiddenFromFeed: body.hiddenFromFeed === true,
        challenge:
          type === "CHALLENGE"
            ? {
                create: {
                  goalCount: Math.min(7, Math.max(1, Number(body.goalCount ?? 7))),
                  deadline: body.deadline
                    ? new Date(body.deadline)
                    : new Date(Date.now() + Math.min(7, Math.max(1, Number(body.goalCount ?? 7))) * 86_400_000),
                  rules: String(body.rules ?? "").trim() || null,
                  reward: body.reward?.trim() || null,
                  isGlobal: body.isGlobal === true,
                },
              }
            : undefined,
      },
      include: {
        challenge: true,
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

    if (type === "CHALLENGE" && post.challenge) {
      await db.challengeParticipant.upsert({
        where: {
          challengeId_userId: {
            challengeId: post.challenge.id,
            userId: session.id,
          },
        },
        create: { challengeId: post.challenge.id, userId: session.id },
        update: {},
      });
      await db.activity.create({
        data: {
          userId: session.id,
          type: "CHALLENGE_CREATED",
          visibility: post.hiddenFromFeed ? "PRIVATE" : "PUBLIC",
          title: title ?? content.slice(0, 80),
          postId: post.id,
        },
      });
    }

    return jsonOk({ post }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
