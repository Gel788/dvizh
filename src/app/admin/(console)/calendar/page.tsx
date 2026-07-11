import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { AdminInspectableRow } from "@/components/admin/preview/admin-inspectable-row";
import { AdminPreviewRoot } from "@/components/admin/preview/admin-preview-root";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCalendarEventAction } from "@/lib/admin/actions";
import { serializeCalendarEventPreview } from "@/lib/admin/preview-serialize";
import type { AdminPreviewMap } from "@/lib/admin/preview-types";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AdminCalendarPage() {
  const events = await db.personalCalendarEvent.findMany({
    orderBy: { eventDate: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, name: true, avatar: true } },
    },
  });

  const fromMove = events.filter((e) => e.sourceKind === "move").length;

  const previews: AdminPreviewMap = Object.fromEntries(
    events.map((ev) => [ev.id, serializeCalendarEventPreview(ev)]),
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="v38 · Календарь"
        title="Личные события"
        description={`${events.length} событий · из Движ: ${fromMove}`}
      />

      <AdminPreviewRoot previews={previews}>
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
              <AdminInspectableRow key={ev.id} inspectId={ev.id}>
                <AdminTd>
                  <p className="font-semibold">{ev.title}</p>
                  {ev.note && <p className="text-xs text-white/35 line-clamp-1">{ev.note}</p>}
                </AdminTd>
                <AdminTd className="text-xs">{ev.eventType}</AdminTd>
                <AdminTd className="text-xs">@{ev.user.username}</AdminTd>
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
                <AdminTd data-no-inspect>
                  <DeleteButton label={ev.title} action={deleteCalendarEventAction.bind(null, ev.id)} />
                </AdminTd>
              </AdminInspectableRow>
            ))}
          </tbody>
        </AdminTable>
      </AdminPreviewRoot>
    </AdminPage>
  );
}
