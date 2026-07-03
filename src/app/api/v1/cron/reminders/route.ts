import { processDueReminders } from "@/lib/push/reminder-scheduler";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const query = new URL(request.url).searchParams.get("secret");
  if (!secret || (header !== secret && query !== secret)) {
    return jsonError("Forbidden", 403, "FORBIDDEN");
  }
  const result = await processDueReminders();
  return jsonOk(result);
}
