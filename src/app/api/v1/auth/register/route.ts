import { registerUser } from "@/lib/api/auth-service";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
  username?: string;
  city?: string;
};

export async function POST(request: Request) {
  const body = await readJson<RegisterBody>(request);
  if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");

  const result = await registerUser({
    email: body.email ?? "",
    password: body.password ?? "",
    name: body.name ?? "",
    username: body.username ?? "",
    city: body.city,
  });

  if ("error" in result) {
    const status = result.code === "EXISTS" ? 409 : 400;
    return jsonError(result.error, status, result.code);
  }

  return jsonOk(result, 201);
}
