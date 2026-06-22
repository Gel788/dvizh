import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, MapPin, Users, Plus, Clock } from "lucide-react";
import { joinEventAction, createEventAction } from "@/lib/actions";
import { PageShell } from "@/components/layout/page-shell";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function EventsPage() {
  const session = await getSession();
  const city = session?.city ?? "Москва";

  const events = await db.event.findMany({
    where: { city, startAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { startAt: "asc" },
    include: {
      organizer: { select: { name: true, username: true } },
      club: { select: { name: true } },
      _count: { select: { attendees: true } },
      attendees: session
        ? { where: { userId: session.id }, select: { id: true } }
        : false,
    },
  });

  const clubs = session
    ? await db.clubMember.findMany({
        where: { userId: session.id },
        include: { club: { select: { id: true, name: true } } },
      })
    : [];

  // Group events by date
  const grouped = events.reduce<Record<string, typeof events>>((acc, event) => {
    const key = format(new Date(event.startAt), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <PageShell
      title="ИВЕНТЫ"
      description="Офлайн-встречи и сезонные события"
      icon={<CalendarDays className="h-6 w-6" />}
      accent="ice"
      action={
        session ? (
          <Dialog>
            <DialogTrigger className="btn-action py-2 px-4 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Создать ивент
            </DialogTrigger>
            <DialogContent className="border-white/[0.09] bg-popover">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Новый ивент</DialogTitle>
              </DialogHeader>
              <form action={createEventAction} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Название</Label>
                  <Input name="title" required className="rounded-xl border-white/[0.09] bg-white/[0.04] h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Описание</Label>
                  <Textarea name="description" required rows={3} className="rounded-xl border-white/[0.09] bg-white/[0.04]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Дата и время</Label>
                  <Input name="startAt" type="datetime-local" required className="rounded-xl border-white/[0.09] bg-white/[0.04] h-11" />
                </div>
                {clubs.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Клуб (опционально)</Label>
                    <select name="clubId" className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm">
                      <option value="">Без клуба</option>
                      {clubs.map((c) => (
                        <option key={c.club.id} value={c.club.id}>{c.club.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <input type="hidden" name="city" value={city} />
                <div className="flex items-center gap-3">
                  <Switch id="isSeasonal" name="isSeasonal" />
                  <Label htmlFor="isSeasonal" className="text-sm font-semibold cursor-pointer">Сезонный ивент</Label>
                </div>
                <button type="submit" className="btn-action w-full h-11">Создать</button>
              </form>
            </DialogContent>
          </Dialog>
        ) : undefined
      }
    >
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <p className="font-heading text-3xl text-ice/40">ИВЕНТОВ НЕТ</p>
          <p className="text-muted-foreground text-sm mt-3">Скоро что-то появится</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              {/* Day separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-center w-12 shrink-0">
                  <span className="font-heading text-3xl text-lime leading-none">
                    {format(new Date(dateKey), "d")}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {format(new Date(dateKey), "MMM", { locale: ru })}
                  </span>
                </div>
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  {format(new Date(dateKey), "EEEE", { locale: ru })}
                </span>
              </div>

              {/* Events for this day */}
              <div className="space-y-3 ml-16">
                {dayEvents.map((event) => {
                  const attendees = Array.isArray(event.attendees) ? event.attendees : [];
                  const attending = attendees.length > 0;

                  return (
                    <div key={event.id} className="card-surface p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-bold text-base">{event.title}</h3>
                            {event.isSeasonal && (
                              <span className="chip chip-lime text-[10px]">Сезонный</span>
                            )}
                            {event.club && (
                              <span className="chip text-[10px]">{event.club.name}</span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                            {event.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-semibold">
                            <span className="inline-flex items-center gap-1 text-ice">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.startAt), "HH:mm")}
                            </span>
                            {event.district && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.district}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event._count.attendees} пойдут
                            </span>
                            <Link
                              href={`/profile/${event.organizer.username}`}
                              className="hover:text-foreground transition-colors cursor-pointer"
                            >
                              @{event.organizer.username}
                            </Link>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {attending ? (
                            <span className="chip chip-lime text-[10px]">Идёшь ✓</span>
                          ) : session ? (
                            <form action={joinEventAction.bind(null, event.id)}>
                              <button type="submit" className="btn-action py-2 px-4 text-xs">
                                Пойду
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
