import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteWishlistAction, toggleWishlistSurpriseAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminWishlistsPage() {
  const lists = await db.wishlist.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      user: { select: { username: true, name: true } },
      _count: { select: { items: true } },
      items: {
        take: 3,
        select: { title: true, reserved: true, reservationStatus: true },
      },
    },
  });

  const surpriseCount = lists.filter((l) => l.surpriseMode).length;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="v38 · Подарки"
        title="Вишлисты"
        description={`${lists.length} списков · surprise mode: ${surpriseCount}`}
      />

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Список</AdminTh>
            <AdminTh>Владелец</AdminTh>
            <AdminTh>Видимость</AdminTh>
            <AdminTh>Surprise</AdminTh>
            <AdminTh>Подарки</AdminTh>
            <AdminTh>Повод</AdminTh>
            <AdminTh>Создан</AdminTh>
            <AdminTh className="text-right">Действия</AdminTh>
          </tr>
        </thead>
        <tbody>
          {lists.map((list) => {
            const reserved = list.items.filter((i) => i.reserved).length;
            return (
              <AdminTr key={list.id}>
                <AdminTd>
                  <p className="font-semibold">{list.title}</p>
                  {list.items.length > 0 && (
                    <p className="text-[10px] text-white/35 mt-1 line-clamp-1">
                      {list.items.map((i) => i.title).join(" · ")}
                    </p>
                  )}
                </AdminTd>
                <AdminTd>
                  <Link href={`/profile/${list.user.username}`} className="text-xs hover:text-lime">
                    @{list.user.username}
                  </Link>
                </AdminTd>
                <AdminTd>
                  <Badge variant="outline" className="text-[10px]">{list.visibility}</Badge>
                </AdminTd>
                <AdminTd>
                  {list.surpriseMode ? (
                    <Badge className="bg-violet/15 text-violet border-violet/20">🎁 surprise</Badge>
                  ) : (
                    <span className="text-xs text-white/35">выкл</span>
                  )}
                </AdminTd>
                <AdminTd className="text-xs">
                  {list._count.items} шт.
                  {reserved > 0 && <span className="text-lime"> · {reserved} бронь</span>}
                </AdminTd>
                <AdminTd className="text-xs text-white/40">{list.occasion ?? "—"}</AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(list.createdAt, "d MMM yyyy", { locale: ru })}
                </AdminTd>
                <AdminTd>
                  <div className="flex justify-end gap-1">
                    <form action={toggleWishlistSurpriseAction.bind(null, list.id)}>
                      <Button type="submit" size="sm" variant="ghost" className="text-xs cursor-pointer">
                        {list.surpriseMode ? "surprise −" : "surprise +"}
                      </Button>
                    </form>
                    <DeleteButton label={list.title} action={deleteWishlistAction.bind(null, list.id)} />
                  </div>
                </AdminTd>
              </AdminTr>
            );
          })}
        </tbody>
      </AdminTable>
    </AdminPage>
  );
}
