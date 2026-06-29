import { loginWithCredentials } from "@/lib/api/auth-service";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type LoginBody = { email?: string; password?: string };

export async function POST(request: Request) {
  const body = await readJson<LoginBody>(request);
  if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");

  const result = await loginWithCredentials(body.email ?? "", body.password ?? "");
  if ("error" in result) {
    const status = result.code === "INVALID_CREDENTIALS" ? 401 : 400;
    return jsonError(result.error, status, result.code);
  }

  return jsonOk(result);
}
