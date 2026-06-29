import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  deleteUserAction,
  setUserRoleAction,
  toggleUserVerifiedAction,
  updateUserReputationAction,
} from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const session = await getSession();

  const users = await db.user.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { username: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { city: { contains: term, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      city: true,
      verified: true,
      reputation: true,
      role: true,
      createdAt: true,
      _count: {
        select: { posts: true, followers: true, following: true },
      },
      profile: { select: { xp: true, level: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Пользователи</h1>
        <p className="mt-2 text-sm text-white/45">
          {term ? `Найдено: ${users.length} по «${term}»` : `${users.length} аккаунтов`}
        </p>
      </div>

      <form method="get" className="mb-6 flex gap-2 max-w-md">
        <Input
          name="q"
          defaultValue={term}
          placeholder="Имя, @username, email, город..."
          className="h-10 rounded-xl border-white/[0.08] bg-white/[0.03]"
        />
        <Button type="submit" className="cursor-pointer shrink-0">Найти</Button>
        {term && (
          <Link href="/admin/users" className="flex items-center text-xs text-white/40 hover:text-white px-2">
            Сброс
          </Link>
        )}
      </form>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Пользователь</AdminTh>
            <AdminTh>Город</AdminTh>
            <AdminTh>XP / Ур.</AdminTh>
            <AdminTh>Активность</AdminTh>
            <AdminTh>Статус</AdminTh>
            <AdminTh>Репутация</AdminTh>
            <AdminTh className="text-right">Действия</AdminTh>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <AdminTd>
                <Link href={`/profile/${u.username}`} className="font-semibold hover:text-lime">
                  {u.name}
                </Link>
                <p className="text-xs text-white/35">@{u.username}</p>
                <p className="text-xs text-white/25">{u.email}</p>
              </AdminTd>
              <AdminTd>{u.city}</AdminTd>
              <AdminTd>
                {u.profile ? `${u.profile.xp} XP · L${u.profile.level}` : "—"}
              </AdminTd>
              <AdminTd className="text-xs text-white/40">
                {u._count.posts} постов<br />
                {u._count.followers} подп. / {u._count.following} подписок
              </AdminTd>
              <AdminTd>
                <div className="flex flex-wrap gap-1">
                  {u.verified && <Badge className="bg-lime/15 text-lime border-lime/20">verified</Badge>}
                  {u.role === "ADMIN" && <Badge className="bg-heat/15 text-heat border-heat/20">admin</Badge>}
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  {format(u.createdAt, "d MMM yyyy", { locale: ru })}
                </p>
              </AdminTd>
              <AdminTd>
                <form action={updateUserReputationAction} className="flex items-center gap-1">
                  <input type="hidden" name="userId" value={u.id} />
                  <Input
                    name="reputation"
                    type="number"
                    defaultValue={u.reputation}
                    className="h-8 w-20 text-xs"
                  />
                  <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs">
                    OK
                  </Button>
                </form>
              </AdminTd>
              <AdminTd className="text-right">
                <div className="flex items-center justify-end gap-1 flex-wrap">
                  <form action={toggleUserVerifiedAction.bind(null, u.id)}>
                    <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs">
                      {u.verified ? "− verify" : "+ verify"}
                    </Button>
                  </form>
                  {u.id !== session?.id && (
                    <form action={setUserRoleAction.bind(null, u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}>
                      <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs">
                        {u.role === "ADMIN" ? "→ user" : "→ admin"}
                      </Button>
                    </form>
                  )}
                  {u.id !== session?.id && (
                    <DeleteButton label={u.name} action={deleteUserAction.bind(null, u.id)} />
                  )}
                </div>
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
