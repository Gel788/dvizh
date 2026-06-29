import {
  followDistrictForUser,
  unfollowDistrictForUser,
  getDiaryBundle,
} from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const bundle = await getDiaryBundle(session.id);
    return jsonOk({ districtFollows: bundle.districtFollows });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

type Body = { district?: string; city?: string };

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    const district = body?.district?.trim();
    const city = body?.city?.trim() || session.city;
    if (!district) return jsonError("district обязателен", 400, "INVALID");
    const row = await followDistrictForUser(session.id, district, city);
    return jsonOk(row, 201);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district")?.trim();
    const city = searchParams.get("city")?.trim() || session.city;
    if (!district) return jsonError("district обязателен", 400, "INVALID");
    await unfollowDistrictForUser(session.id, district, city);
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
