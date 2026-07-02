import {
  completeDiaryTaskForUser,
  createDiaryTaskForUser,
  reorderDiaryTasksForUser,
} from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type CreateTaskBody = {
  text?: string;
  note?: string;
  period?: string;
  visibility?: string;
  hashtag?: string;
  hashtagColor?: string;
  trackStreak?: boolean;
  isRecurring?: boolean;
  recurrence?: string;
  multiLine?: boolean;
  dueDate?: string;
  reminderAt?: string;
  checklist?: string[] | string;
  priority?: boolean;
  askProof?: boolean;
};

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<CreateTaskBody>(request);
    if (!body?.text?.trim()) return jsonError("Текст задачи обязателен", 400, "EMPTY");

    let checklist: string[] | undefined;
    if (Array.isArray(body.checklist)) {
      checklist = body.checklist.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof body.checklist === "string" && body.checklist.trim()) {
      checklist = body.checklist.split("\n").map((s) => s.trim()).filter(Boolean);
    }

    const created = await createDiaryTaskForUser(session.id, {
      text: body.text,
      note: body.note,
      period: body.period ?? "today",
      visibility: body.visibility ?? "private",
      hashtag: body.hashtag,
      hashtagColor: body.hashtagColor,
      trackStreak: body.trackStreak,
      isRecurring: body.isRecurring,
      recurrence: body.recurrence,
      multiLine: body.multiLine,
      dueDate: body.dueDate,
      reminderAt: body.reminderAt,
      checklist,
      priority: body.priority,
      askProof: body.askProof,
    });

    return jsonOk({ tasks: created }, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<{ period?: string; orderedIds?: string[] }>(request);
    if (!body?.period || !body.orderedIds?.length) {
      return jsonError("period и orderedIds обязательны", 400, "INVALID");
    }

    await reorderDiaryTasksForUser(session.id, body.period, body.orderedIds);
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
