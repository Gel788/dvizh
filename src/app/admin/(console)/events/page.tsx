import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteEventAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";

export default async function AdminEventsPage() {
  const events = await db.event.findMany({
    orderBy: { startAt: "desc" },
    include: {
      organizer: { select: { username: true, name: true } },
      club: { select: { name: true } },
      _count: { select: { attendees: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">События</h1>
        <p className="mt-2 text-sm text-white/45">{events.length} событий в календаре</p>
      </div>

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
            <tr key={e.id}>
              <AdminTd>
                <p className="font-semibold">{e.title}</p>
                <p className="text-xs text-white/35 line-clamp-1">{e.description}</p>
              </AdminTd>
              <AdminTd>@{e.organizer.username}</AdminTd>
              <AdminTd>{e.club?.name ?? "—"}</AdminTd>
              <AdminTd className="text-xs text-white/40">
                {e.city}{e.district ? ` · ${e.district}` : ""}
              </AdminTd>
              <AdminTd>{e._count.attendees}</AdminTd>
              <AdminTd className="text-xs text-white/35">
                {format(e.startAt, "d MMM yyyy HH:mm", { locale: ru })}
              </AdminTd>
              <AdminTd>
                <DeleteButton label={e.title} action={deleteEventAction.bind(null, e.id)} />
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
