import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMediaItemAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AdminMediaPage() {
  const items = await db.mediaItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, name: true } },
    },
  });

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="v38 · Медиа"
        title="Медиаритм"
        description={`${items.length} записей — фильмы, книги, игры, сериалы`}
      />

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
            <AdminTr key={item.id}>
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
              <AdminTd>
                <Link href={`/profile/${item.user.username}`} className="text-xs hover:text-lime">
                  @{item.user.username}
                </Link>
              </AdminTd>
              <AdminTd className="text-xs text-white/35">
                {format(item.createdAt, "d MMM yyyy", { locale: ru })}
              </AdminTd>
              <AdminTd>
                <DeleteButton label={item.title} action={deleteMediaItemAction.bind(null, item.id)} />
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
    </AdminPage>
  );
}
