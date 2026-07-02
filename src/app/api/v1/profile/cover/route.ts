import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { saveCoverFromDataUrl } from "@/lib/upload/cover";

type Body = { cover?: string };

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.cover?.startsWith("data:image/")) {
      return jsonError("Некорректное изображение", 400, "INVALID_IMAGE");
    }

    const coverImage = await saveCoverFromDataUrl(session.id, body.cover);

    const user = await db.user.update({
      where: { id: session.id },
      data: { coverImage },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        coverImage: true,
        bio: true,
        city: true,
        district: true,
        verified: true,
        reputation: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    return jsonOk({ user, coverImage });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "INVALID_IMAGE") return jsonError("Некорректный формат", 400, "INVALID_IMAGE");
      if (e.message === "FILE_TOO_LARGE") return jsonError("Файл больше 4 МБ", 400, "FILE_TOO_LARGE");
    }
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
