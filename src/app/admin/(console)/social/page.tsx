import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  deleteDuelAction,
  deleteFriendshipAction,
  deleteSharedGoalAction,
  resolveJoinRequestAction,
} from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminSocialPage() {
  const [duels, goals, friendships, joinRequests] = await Promise.all([
    db.duel.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        creator: { select: { username: true, name: true } },
        _count: { select: { participants: true } },
      },
    }),
    db.sharedGoal.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        creator: { select: { username: true, name: true } },
        _count: { select: { members: true, items: true } },
      },
    }),
    db.friendship.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requester: { select: { username: true, name: true } },
        addressee: { select: { username: true, name: true } },
      },
    }),
    db.moveJoinRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true, name: true } },
      },
    }),
  ]);

  const pendingFriends = friendships.filter((f) => f.status === "PENDING");
  const pendingJoin = joinRequests.filter((j) => j.status === "PENDING");

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="v38 · Соц"
        title="Спор, Вместе, Друзья, Движ"
        description={`Споры ${duels.length} · Вместе ${goals.length} · заявок в друзья ${pendingFriends.length} · Move ${pendingJoin.length} ожидают`}
      />

      <section className="mb-10">
        <h2 className="font-heading text-xl mb-1">Споры (Duels)</h2>
        <p className="text-sm text-muted-foreground mb-4">Приватные дуэли — launch-only PRIVATE</p>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Название</AdminTh>
              <AdminTh>Создатель</AdminTh>
              <AdminTh>Видимость</AdminTh>
              <AdminTh>Участники</AdminTh>
              <AdminTh>Создан</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {duels.map((d) => (
              <AdminTr key={d.id}>
                <AdminTd>
                  <p className="font-semibold">{d.emoji ? `${d.emoji} ` : ""}{d.title}</p>
                  {d.description && <p className="text-xs text-white/35 line-clamp-1">{d.description}</p>}
                </AdminTd>
                <AdminTd>
                  <Link href={`/profile/${d.creator.username}`} className="text-xs hover:text-lime">
                    @{d.creator.username}
                  </Link>
                </AdminTd>
                <AdminTd>
                  <Badge variant="outline" className="text-[10px]">{d.visibility}</Badge>
                </AdminTd>
                <AdminTd>{d._count.participants}</AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(d.createdAt, "d MMM yyyy", { locale: ru })}
                </AdminTd>
                <AdminTd>
                  <DeleteButton label={d.title} action={deleteDuelAction.bind(null, d.id)} />
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl mb-1">Вместе (Shared goals)</h2>
        <p className="text-sm text-muted-foreground mb-4">Общие цели и списки задач</p>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Цель</AdminTh>
              <AdminTh>Создатель</AdminTh>
              <AdminTh>Участники</AdminTh>
              <AdminTh>Пункты</AdminTh>
              <AdminTh>Событие</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {goals.map((g) => (
              <AdminTr key={g.id}>
                <AdminTd className="font-semibold">{g.title}</AdminTd>
                <AdminTd>
                  <Link href={`/profile/${g.creator.username}`} className="text-xs hover:text-lime">
                    @{g.creator.username}
                  </Link>
                </AdminTd>
                <AdminTd>{g._count.members}</AdminTd>
                <AdminTd>{g._count.items}</AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {g.eventAt ? format(g.eventAt, "d MMM yyyy", { locale: ru }) : "—"}
                </AdminTd>
                <AdminTd>
                  <DeleteButton label={g.title} action={deleteSharedGoalAction.bind(null, g.id)} />
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl mb-1">Дружба</h2>
        <p className="text-sm text-muted-foreground mb-4">Заявки и связи</p>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>От</AdminTh>
              <AdminTh>Кому</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Дата</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {friendships.map((f) => (
              <AdminTr key={f.id}>
                <AdminTd>@{f.requester.username}</AdminTd>
                <AdminTd>@{f.addressee.username}</AdminTd>
                <AdminTd>
                  <Badge className={f.status === "PENDING" ? "bg-heat/15 text-heat" : "bg-lime/15 text-lime"}>
                    {f.status === "PENDING" ? "ожидает" : "друзья"}
                  </Badge>
                </AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(f.createdAt, "d MMM HH:mm", { locale: ru })}
                </AdminTd>
                <AdminTd>
                  <DeleteButton label={`${f.requester.username} → ${f.addressee.username}`} action={deleteFriendshipAction.bind(null, f.id)} />
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </section>

      <section>
        <h2 className="font-heading text-xl mb-1">Заявки Move</h2>
        <p className="text-sm text-muted-foreground mb-4">Join requests на события / активности</p>
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Пользователь</AdminTh>
              <AdminTh>Активность</AdminTh>
              <AdminTh>Тип</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Дата</AdminTh>
              <AdminTh className="text-right">Действия</AdminTh>
            </tr>
          </thead>
          <tbody>
            {joinRequests.map((r) => (
              <AdminTr key={r.id}>
                <AdminTd>
                  <Link href={`/profile/${r.user.username}`} className="text-xs hover:text-lime">
                    @{r.user.username}
                  </Link>
                </AdminTd>
                <AdminTd className="font-mono text-xs">{r.activityId.slice(0, 12)}…</AdminTd>
                <AdminTd className="text-xs">{r.activityKind}</AdminTd>
                <AdminTd>
                  <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                </AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(r.createdAt, "d MMM HH:mm", { locale: ru })}
                </AdminTd>
                <AdminTd>
                  {r.status === "PENDING" && (
                    <div className="flex justify-end gap-1">
                      <form action={resolveJoinRequestAction.bind(null, r.id, "APPROVED")}>
                        <Button type="submit" size="sm" variant="ghost" className="text-xs text-lime cursor-pointer">✓</Button>
                      </form>
                      <form action={resolveJoinRequestAction.bind(null, r.id, "DECLINED")}>
                        <Button type="submit" size="sm" variant="ghost" className="text-xs text-heat cursor-pointer">✕</Button>
                      </form>
                    </div>
                  )}
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </section>
    </AdminPage>
  );
}
