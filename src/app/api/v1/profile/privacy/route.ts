import { getDiaryBundle, updatePrivacyForUser } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type Body = {
  defaultDiary?: string;
  defaultWishlist?: string;
  defaultMedia?: string;
  defaultEvents?: string;
  locationPrecision?: string;
  profileInSearch?: boolean;
  diaryScope?: string;
  friendRequests?: string;
  subscriptions?: string;
};

export async function PATCH(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<Body>(request);
    if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");
    const privacy = await updatePrivacyForUser(session.id, body);
    return jsonOk({ privacy });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const bundle = await getDiaryBundle(session.id);
    return jsonOk({ privacy: bundle.privacy, districtFollows: bundle.districtFollows });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
