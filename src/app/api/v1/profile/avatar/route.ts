import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { absoluteAvatarUrl, saveAvatarFromDataUrl } from "@/lib/upload/avatar";

type Body = { avatar?: string };

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body?.avatar?.startsWith("data:image/")) {
      return jsonError("Некорректное изображение", 400, "INVALID_IMAGE");
    }

    const relative = await saveAvatarFromDataUrl(session.id, body.avatar);
    const avatar = absoluteAvatarUrl(relative);

    const user = await db.user.update({
      where: { id: session.id },
      data: { avatar },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        verified: true,
      },
    });

    return jsonOk({ user, avatar });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "INVALID_IMAGE") return jsonError("Некорректный формат", 400, "INVALID_IMAGE");
      if (e.message === "FILE_TOO_LARGE") return jsonError("Файл больше 2 МБ", 400, "FILE_TOO_LARGE");
    }
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
