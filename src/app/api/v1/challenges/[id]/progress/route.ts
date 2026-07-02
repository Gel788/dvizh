import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: challengeId } = await params;
  const body = await request.json().catch(() => ({}));
  const increment = typeof body.increment === "number" ? body.increment : 1;
  const absolute = typeof body.progress === "number" ? body.progress : null;

  const part = await db.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.id } },
  });
  if (!part) {
    return NextResponse.json({ error: "Not a participant" }, { status: 404 });
  }

  const nextProgress = absolute !== null ? absolute : part.progress + increment;
  const updated = await db.challengeParticipant.update({
    where: { id: part.id },
    data: { progress: Math.max(0, nextProgress) },
    select: { progress: true, streak: true },
  });

  return NextResponse.json({ ok: true, progress: updated.progress, streak: updated.streak });
}
