import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Activity, Users } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { getAdminStats } from "@/lib/admin/stats";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Обзор</h1>
        <p className="mt-2 text-sm text-white/45">Метрики платформы и последняя активность</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatCard label="Пользователи" value={stats.usersTotal} hint={`+${stats.usersToday} за 24ч`} />
        <StatCard label="Посты" value={stats.postsTotal} hint={`+${stats.postsToday} за 24ч`} accent="ice" />
        <StatCard label="Челленджи" value={stats.challengesTotal} accent="heat" />
        <StatCard label="События" value={stats.eventsTotal} accent="ice" />
        <StatCard label="Клубы" value={stats.clubsTotal} />
        <StatCard label="Дружбы" value={stats.friendshipsTotal} accent="ice" />
        <StatCard label="Лайки" value={stats.likesTotal} />
        <StatCard label="Комментарии" value={stats.commentsTotal} accent="heat" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-lime" />
            <h2 className="font-heading text-xl">Новые пользователи</h2>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Имя</AdminTh>
                <AdminTh>Роль</AdminTh>
                <AdminTh>Когда</AdminTh>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u) => (
                <tr key={u.id}>
                  <AdminTd>
                    <Link href={`/profile/${u.username}`} className="hover:text-lime">
                      {u.name}
                    </Link>
                    <p className="text-xs text-white/35">@{u.username}</p>
                  </AdminTd>
                  <AdminTd>
                    <span className={u.role === "ADMIN" ? "text-heat" : ""}>{u.role}</span>
                  </AdminTd>
                  <AdminTd className="text-white/40 text-xs">
                    {formatDistanceToNow(u.createdAt, { addSuffix: true, locale: ru })}
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-ice" />
            <h2 className="font-heading text-xl">Последние посты</h2>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Контент</AdminTh>
                <AdminTh>Тип</AdminTh>
                <AdminTh>Реакции</AdminTh>
              </tr>
            </thead>
            <tbody>
              {stats.recentPosts.map((p) => (
                <tr key={p.id}>
                  <AdminTd>
                    <p className="line-clamp-2">{p.title ?? p.content}</p>
                    <p className="text-xs text-white/35">@{p.author.username} · {p.city}</p>
                  </AdminTd>
                  <AdminTd>{p.type}</AdminTd>
                  <AdminTd className="text-xs text-white/40">
                    ♥ {p._count.likes} · 💬 {p._count.comments}
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h3 className="font-heading text-lg mb-4">Пользователи по городам</h3>
          <ul className="space-y-2">
            {stats.usersByCity.map((row) => (
              <li key={row.city} className="flex justify-between text-sm">
                <span>{row.city}</span>
                <span className="text-lime font-semibold">{row._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h3 className="font-heading text-lg mb-4">Посты по типам</h3>
          <ul className="space-y-2">
            {stats.postsByType.map((row) => (
              <li key={row.type} className="flex justify-between text-sm">
                <span>{row.type}</span>
                <span className="text-ice font-semibold">{row._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
