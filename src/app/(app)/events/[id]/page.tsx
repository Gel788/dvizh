import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { joinEventAction } from "@/lib/actions";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const event = await db.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, username: true, avatar: true } },
      _count: { select: { attendees: true } },
      attendees: session
        ? { where: { userId: session.id }, select: { id: true } }
        : false,
    },
  });

  if (!event) notFound();

  const joined = session && Array.isArray(event.attendees) && event.attendees.length > 0;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5 pb-28">
      <Link href="/nearby" className="text-sm text-muted-foreground hover:text-lime">← Рядом</Link>
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">📍</span>
          <div>
            <h1 className="font-heading text-xl font-bold">{event.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(event.startAt, "d MMMM, HH:mm", { locale: ru })}
              {event.endAt ? ` — ${format(event.endAt, "HH:mm", { locale: ru })}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-2">📍 {event.city}{event.district ? ` · ${event.district}` : ""}</p>
          </div>
        </div>
        {event.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
        )}
        <p className="text-xs font-bold text-lime">{event._count.attendees} идут</p>
        {session && (
          <form action={async () => {
            "use server";
            await joinEventAction(event.id);
          }}>
            <button
              type="submit"
              disabled={!!joined}
              className="btn-action w-full py-2.5 text-sm disabled:opacity-60"
            >
              {joined ? "Ты идёшь ✓" : "Пойду"}
            </button>
          </form>
        )}
        <Link
          href={`/profile/${event.organizer.username}`}
          className="flex items-center gap-2 text-sm hover:text-lime transition-colors"
        >
          Организатор: <b>{event.organizer.name}</b>
        </Link>
      </div>
    </div>
  );
}
