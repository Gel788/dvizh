import { getDiaryTaskForUser, updateDiaryTaskForUser } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type UpdateTaskBody = {
  text?: string;
  note?: string;
  period?: string;
  visibility?: string;
  hashtag?: string;
  hashtagColor?: string;
  trackStreak?: boolean;
  isRecurring?: boolean;
  recurrence?: string;
  dueDate?: string | null;
  reminderAt?: string | null;
  priority?: boolean;
  askProof?: boolean;
  hasTime?: boolean;
  scheduledAt?: string | null;
  checklist?: string[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(_request);
    const { id } = await params;
    const task = await getDiaryTaskForUser(session.id, id);
    if (!task) return jsonError("Задача не найдена", 404, "NOT_FOUND");
    return jsonOk({ task });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await readJson<UpdateTaskBody>(request);
    if (!body) return jsonError("Пустое тело запроса", 400, "INVALID");

    const updated = await updateDiaryTaskForUser(session.id, id, body);
    if (!updated) return jsonError("Задача не найдена", 404, "NOT_FOUND");

    return jsonOk({ task: updated });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
