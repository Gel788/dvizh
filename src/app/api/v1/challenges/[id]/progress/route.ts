import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveImageFromDataUrl } from "@/lib/upload/media";

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
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const image = typeof body.image === "string" ? body.image : "";

  const part = await db.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.id } },
  });
  if (!part) {
    return NextResponse.json({ error: "Not a participant" }, { status: 404 });
  }

  let proofUrl: string | undefined;
  if (image.startsWith("data:image/")) {
    try {
      proofUrl = await saveImageFromDataUrl(
        `challenge-proofs/${session.id}`,
        `${challengeId}-${Date.now()}`,
        image,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "INVALID_IMAGE";
      if (message === "FILE_TOO_LARGE") {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
  }

  if (content || proofUrl) {
    await db.challengeReport.create({
      data: {
        challengeId,
        userId: session.id,
        content: content || (proofUrl ? "Фото-пруф" : "Отметка"),
        image: proofUrl,
        lat: session.lat,
        lng: session.lng,
      },
    });
  }

  const nextProgress = absolute !== null ? absolute : part.progress + increment;
  const updated = await db.challengeParticipant.update({
    where: { id: part.id },
    data: {
      progress: Math.max(0, nextProgress),
      streak: part.streak + 1,
    },
    select: { progress: true, streak: true },
  });

  return NextResponse.json({
    ok: true,
    progress: updated.progress,
    streak: updated.streak,
    proofUrl: proofUrl ?? null,
  });
}
