import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Activity,
  Heart,
  MessageCircle,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import { getAdminStats } from "@/lib/admin/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const maxCity = Math.max(...stats.usersByCity.map((r) => r._count._all), 1);
  const maxType = Math.max(...stats.postsByType.map((r) => r._count._all), 1);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Панель управления"
        title="Обзор"
        description="Метрики платформы, рост за сутки и последняя активность в реальном времени."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Пользователи" value={stats.usersTotal} hint={`+${stats.usersToday} за 24ч`} icon={Users} />
        <StatCard label="Посты" value={stats.postsTotal} hint={`+${stats.postsToday} за 24ч`} accent="ice" icon={Activity} />
        <StatCard label="Челленджи" value={stats.challengesTotal} accent="heat" icon={Trophy} />
        <StatCard label="События" value={stats.eventsTotal} accent="muted" icon={Activity} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Клубы" value={stats.clubsTotal} accent="muted" />
        <StatCard label="Дружбы" value={stats.friendshipsTotal} accent="ice" />
        <StatCard label="Лайки" value={stats.likesTotal} accent="lime" icon={Heart} />
        <StatCard label="Комментарии" value={stats.commentsTotal} accent="heat" icon={MessageCircle} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <AdminSection title="Новые пользователи" icon={<UserPlus className="h-4 w-4 text-lime" />}>
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
                <AdminTr key={u.id}>
                  <AdminTd>
                    <Link href={`/profile/${u.username}`} className="font-semibold hover:text-lime">
                      {u.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </AdminTd>
                  <AdminTd>
                    <span className={u.role === "ADMIN" ? "text-heat font-semibold" : ""}>{u.role}</span>
                  </AdminTd>
                  <AdminTd className="text-xs text-muted-foreground">
                    {formatDistanceToNow(u.createdAt, { addSuffix: true, locale: ru })}
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        </AdminSection>

        <AdminSection title="Последние посты" icon={<Activity className="h-4 w-4 text-ice" />}>
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
                <AdminTr key={p.id}>
                  <AdminTd>
                    <p className="line-clamp-2 font-medium">{p.title ?? p.content}</p>
                    <p className="text-xs text-muted-foreground">@{p.author.username} · {p.city}</p>
                  </AdminTd>
                  <AdminTd>
                    <span className="chip text-[10px] py-0.5">{p.type}</span>
                  </AdminTd>
                  <AdminTd className="text-xs text-muted-foreground">
                    ♥ {p._count.likes} · 💬 {p._count.comments}
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        </AdminSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.07] bg-card/50 ring-1 ring-white/[0.03]">
          <CardHeader className="border-b border-white/[0.05]">
            <CardTitle className="font-heading text-lg">Пользователи по городам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {stats.usersByCity.map((row) => (
              <div key={row.city}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{row.city}</span>
                  <span className="font-semibold tabular-nums text-lime">{row._count._all}</span>
                </div>
                <Progress value={(row._count._all / maxCity) * 100} className="h-1.5 progress-lime" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/[0.07] bg-card/50 ring-1 ring-white/[0.03]">
          <CardHeader className="border-b border-white/[0.05]">
            <CardTitle className="font-heading text-lg">Посты по типам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {stats.postsByType.map((row) => (
              <div key={row.type}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{row.type}</span>
                  <span className="font-semibold tabular-nums text-ice">{row._count._all}</span>
                </div>
                <Progress value={(row._count._all / maxType) * 100} className="h-1.5 [&>div]:bg-ice" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
