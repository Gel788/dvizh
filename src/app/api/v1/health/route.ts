import { jsonOk } from "@/lib/api/http";

export async function GET() {
  return jsonOk({
    ok: true,
    service: "dvizh-api",
    version: "1",
    time: new Date().toISOString(),
  });
}
