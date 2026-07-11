import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { AdminInspectableRow } from "@/components/admin/preview/admin-inspectable-row";
import { AdminPreviewRoot } from "@/components/admin/preview/admin-preview-root";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteClubAction } from "@/lib/admin/actions";
import { serializeClubPreview } from "@/lib/admin/preview-serialize";
import type { AdminPreviewMap } from "@/lib/admin/preview-types";
import { db } from "@/lib/db";

export default async function AdminClubsPage() {
  const clubs = await db.club.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { username: true, name: true, avatar: true } },
      _count: { select: { members: true, events: true } },
    },
  });

  const previews: AdminPreviewMap = Object.fromEntries(
    clubs.map((c) => [c.id, serializeClubPreview(c)]),
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Контент"
        title="Клубы"
        description={`${clubs.length} клубов`}
      />

      <AdminPreviewRoot previews={previews}>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Клуб</AdminTh>
              <AdminTh>Создатель</AdminTh>
              <AdminTh>Город</AdminTh>
              <AdminTh>Участники</AdminTh>
              <AdminTh>События</AdminTh>
              <AdminTh>Приватность</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => (
              <AdminInspectableRow key={c.id} inspectId={c.id}>
                <AdminTd>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-white/35 line-clamp-1">{c.description}</p>
                </AdminTd>
                <AdminTd className="text-xs">@{c.creator.username}</AdminTd>
                <AdminTd>{c.city}</AdminTd>
                <AdminTd>{c._count.members}</AdminTd>
                <AdminTd>{c._count.events}</AdminTd>
                <AdminTd>{c.isPrivate ? "🔒 private" : "public"}</AdminTd>
                <AdminTd data-no-inspect>
                  <DeleteButton label={c.name} action={deleteClubAction.bind(null, c.id)} />
                </AdminTd>
              </AdminInspectableRow>
            ))}
          </tbody>
        </AdminTable>
      </AdminPreviewRoot>
    </AdminPage>
  );
}
