import { getDiaryBundle } from "@/lib/diary-actions";
import { parseTzOffset } from "@/lib/diary-time";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const tzOffset = parseTzOffset(searchParams.get("tzOffset"));
    const diary = await getDiaryBundle(session.id, tzOffset);
    return jsonOk({ diary });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
