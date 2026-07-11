import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCalendarEventAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AdminCalendarPage() {
  const events = await db.personalCalendarEvent.findMany({
    orderBy: { eventDate: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, name: true } },
    },
  });

  const fromMove = events.filter((e) => e.sourceKind === "move").length;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="v38 · Календарь"
        title="Личные события"
        description={`${events.length} событий · из Движ: ${fromMove}`}
      />

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Событие</AdminTh>
            <AdminTh>Тип</AdminTh>
            <AdminTh>Владелец</AdminTh>
            <AdminTh>Видимость</AdminTh>
            <AdminTh>Источник</AdminTh>
            <AdminTh>Дата</AdminTh>
            <AdminTh />
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <AdminTr key={ev.id}>
              <AdminTd>
                <p className="font-semibold">{ev.title}</p>
                {ev.note && <p className="text-xs text-white/35 line-clamp-1">{ev.note}</p>}
              </AdminTd>
              <AdminTd className="text-xs">{ev.eventType}</AdminTd>
              <AdminTd>
                <Link href={`/profile/${ev.user.username}`} className="text-xs hover:text-lime">
                  @{ev.user.username}
                </Link>
              </AdminTd>
              <AdminTd>
                <Badge variant="outline" className="text-[10px]">{ev.visibility}</Badge>
              </AdminTd>
              <AdminTd className="text-xs text-white/40">
                {ev.sourceKind ?? "manual"}
                {ev.sourceId && <span className="font-mono"> · {ev.sourceId.slice(0, 8)}</span>}
              </AdminTd>
              <AdminTd className="text-xs text-white/35">
                {format(ev.hasTime && ev.scheduledAt ? ev.scheduledAt : ev.eventDate, "d MMM yyyy HH:mm", { locale: ru })}
              </AdminTd>
              <AdminTd>
                <DeleteButton label={ev.title} action={deleteCalendarEventAction.bind(null, ev.id)} />
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
    </AdminPage>
  );
}
