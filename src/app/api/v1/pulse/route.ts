import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getPulseDay } from "@/lib/pulse-service";

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);
  const city = user?.city ?? "Москва";
  const pulse = await getPulseDay(city, user?.id);
  return NextResponse.json(pulse);
}
