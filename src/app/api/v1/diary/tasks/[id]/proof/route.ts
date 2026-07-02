import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { saveImageFromDataUrl } from "@/lib/upload/media";

type Body = { image?: string; visibility?: "PRIVATE" | "FRIENDS" | "PUBLIC" };

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<Body>(request);
    if (!body?.image?.startsWith("data:image/")) {
      return jsonError("Некорректное изображение", 400, "INVALID_IMAGE");
    }

    const task = await db.diaryTask.findFirst({ where: { id, userId: session.id } });
    if (!task) return jsonError("Задача не найдена", 404, "NOT_FOUND");
    if (!task.done) return jsonError("Сначала отметь дело выполненным", 400, "NOT_DONE");

    const proofUrl = await saveImageFromDataUrl(`proofs/${session.id}`, task.id, body.image);
    const visibility = body.visibility ?? task.visibility;

    const updated = await db.diaryTask.update({
      where: { id },
      data: { proofUrl },
    });

    await db.activity.create({
      data: {
        userId: session.id,
        type: "TASK_PROOF",
        visibility,
        title: `Фото-пруф: ${task.title}`,
        body: "Подтверждение выполнения дела",
        taskId: task.id,
        xpGained: 5,
        metadata: JSON.stringify({ proofUrl }),
      },
    });

    return jsonOk({ task: { id: updated.id, proofUrl: updated.proofUrl }, xpBonus: 5 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "INVALID_IMAGE") return jsonError("Некорректный формат", 400, "INVALID_IMAGE");
      if (e.message === "FILE_TOO_LARGE") return jsonError("Файл больше 5 МБ", 400, "FILE_TOO_LARGE");
    }
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
