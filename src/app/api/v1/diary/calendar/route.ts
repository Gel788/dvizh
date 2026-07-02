import { getCalendarData } from "@/lib/diary-actions";
import { parseTzOffset } from "@/lib/diary-time";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    const month = Number(searchParams.get("month") ?? new Date().getMonth());
    const tzOffset = parseTzOffset(searchParams.get("tzOffset"));
    const calendar = await getCalendarData(session.id, year, month, tzOffset);
    return jsonOk({ calendar });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
