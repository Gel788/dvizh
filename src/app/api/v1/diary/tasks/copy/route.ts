import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const sourceTaskId = String(body.taskId ?? "").trim();
  if (!sourceTaskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  const source = await db.diaryTask.findUnique({ where: { id: sourceTaskId } });
  if (!source || source.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Task not copyable" }, { status: 403 });
  }

  const exists = await db.taskCopy.findUnique({
    where: { sourceTaskId_userId: { sourceTaskId, userId: session.id } },
  });
  if (exists) {
    return NextResponse.json({ ok: true, duplicated: false });
  }

  const task = await db.$transaction(async (tx) => {
    const created = await tx.diaryTask.create({
      data: {
        userId: session.id,
        title: source.title,
        note: source.note,
        period: "TODAY",
        visibility: "PRIVATE",
        sourceTaskId,
        hashtag: source.hashtag,
        hashtagColor: source.hashtagColor,
      },
    });
    await tx.taskCopy.create({ data: { sourceTaskId, userId: session.id } });
    await tx.diaryTask.update({
      where: { id: sourceTaskId },
      data: { copyCount: { increment: 1 } },
    });
    return created;
  });

  return NextResponse.json({ ok: true, duplicated: true, task: { id: task.id, title: task.title } });
}
