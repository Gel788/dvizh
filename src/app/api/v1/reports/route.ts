import { db } from "@/lib/db";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<{
      targetKind?: string;
      targetId?: string;
      reason?: string;
      details?: string;
    }>(request);

    const targetKind = body?.targetKind?.trim().toLowerCase();
    const targetId = body?.targetId?.trim();
    const reason = body?.reason?.trim();

    if (!targetKind || !targetId || !reason) {
      return jsonError("targetKind, targetId и reason обязательны", 400, "INVALID");
    }

    const allowed = new Set(["post", "user", "event", "challenge", "comment"]);
    if (!allowed.has(targetKind)) {
      return jsonError("Неподдерживаемый targetKind", 400, "INVALID_KIND");
    }

    const report = await db.contentReport.create({
      data: {
        reporterId: session.id,
        targetKind,
        targetId,
        reason,
        details: body?.details?.trim() || null,
      },
    });

    return jsonOk({ ok: true, report });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
    }
    throw e;
  }
}
