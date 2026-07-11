import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { AdminInspectableRow } from "@/components/admin/preview/admin-inspectable-row";
import { AdminPreviewRoot } from "@/components/admin/preview/admin-preview-root";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteEventAction } from "@/lib/admin/actions";
import { serializeEventPreview } from "@/lib/admin/preview-serialize";
import type { AdminPreviewMap } from "@/lib/admin/preview-types";
import { db } from "@/lib/db";

export default async function AdminEventsPage() {
  const events = await db.event.findMany({
    orderBy: { startAt: "desc" },
    include: {
      organizer: { select: { username: true, name: true, avatar: true } },
      club: { select: { name: true } },
      _count: { select: { attendees: true } },
    },
  });

  const previews: AdminPreviewMap = Object.fromEntries(
    events.map((e) => [e.id, serializeEventPreview(e)]),
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Контент"
        title="События"
        description={`${events.length} событий в календаре`}
      />

      <AdminPreviewRoot previews={previews}>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Событие</AdminTh>
              <AdminTh>Организатор</AdminTh>
              <AdminTh>Клуб</AdminTh>
              <AdminTh>Локация</AdminTh>
              <AdminTh>Участники</AdminTh>
              <AdminTh>Начало</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <AdminInspectableRow key={e.id} inspectId={e.id}>
                <AdminTd>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-xs text-white/35 line-clamp-1">{e.description}</p>
                </AdminTd>
                <AdminTd className="text-xs">@{e.organizer.username}</AdminTd>
                <AdminTd>{e.club?.name ?? "—"}</AdminTd>
                <AdminTd className="text-xs text-white/40">
                  {e.city}{e.district ? ` · ${e.district}` : ""}
                </AdminTd>
                <AdminTd>{e._count.attendees}</AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(e.startAt, "d MMM yyyy HH:mm", { locale: ru })}
                </AdminTd>
                <AdminTd data-no-inspect>
                  <DeleteButton label={e.title} action={deleteEventAction.bind(null, e.id)} />
                </AdminTd>
              </AdminInspectableRow>
            ))}
          </tbody>
        </AdminTable>
      </AdminPreviewRoot>
    </AdminPage>
  );
}
