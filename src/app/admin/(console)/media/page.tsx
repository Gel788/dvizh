import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { AdminInspectableRow } from "@/components/admin/preview/admin-inspectable-row";
import { AdminPreviewRoot } from "@/components/admin/preview/admin-preview-root";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMediaItemAction } from "@/lib/admin/actions";
import { serializeMediaPreview } from "@/lib/admin/preview-serialize";
import type { AdminPreviewMap } from "@/lib/admin/preview-types";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AdminMediaPage() {
  const items = await db.mediaItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, name: true, avatar: true } },
    },
  });

  const previews: AdminPreviewMap = Object.fromEntries(
    items.map((item) => [item.id, serializeMediaPreview(item)]),
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="v38 · Медиа"
        title="Медиаритм"
        description={`${items.length} записей — фильмы, книги, игры, сериалы`}
      />

      <AdminPreviewRoot previews={previews}>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Название</AdminTh>
              <AdminTh>Тип</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Рейтинг</AdminTh>
              <AdminTh>Видимость</AdminTh>
              <AdminTh>Автор</AdminTh>
              <AdminTh>Дата</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <AdminInspectableRow key={item.id} inspectId={item.id}>
                <AdminTd>
                  <p className="font-semibold line-clamp-2">{item.title}</p>
                  {item.pinned && <Badge className="mt-1 bg-lime/15 text-lime text-[10px]">закреп</Badge>}
                </AdminTd>
                <AdminTd className="text-xs">{item.type}</AdminTd>
                <AdminTd className="text-xs">{item.status}</AdminTd>
                <AdminTd className="text-xs">{item.rating != null ? `${item.rating}/10` : "—"}</AdminTd>
                <AdminTd>
                  <Badge variant="outline" className="text-[10px]">{item.visibility}</Badge>
                </AdminTd>
                <AdminTd className="text-xs">@{item.user.username}</AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(item.createdAt, "d MMM yyyy", { locale: ru })}
                </AdminTd>
                <AdminTd data-no-inspect>
                  <DeleteButton label={item.title} action={deleteMediaItemAction.bind(null, item.id)} />
                </AdminTd>
              </AdminInspectableRow>
            ))}
          </tbody>
        </AdminTable>
      </AdminPreviewRoot>
    </AdminPage>
  );
}
