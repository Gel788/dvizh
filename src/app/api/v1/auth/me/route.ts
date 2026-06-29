import { getSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);
  if (!user) return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  return jsonOk({ user });
}
