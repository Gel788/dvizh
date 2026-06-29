import { BroadcastForm } from "@/components/admin/broadcast-form";
import { StatCard } from "@/components/admin/stat-card";
import { getAdminStats } from "@/lib/admin/stats";

export default async function AdminSystemPage() {
  const stats = await getAdminStats();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://www.flroal.ru";

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[900px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Система</h1>
        <p className="mt-2 text-sm text-white/45">Сервисы, рассылки и диагностика</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <StatCard label="Задачи дневника" value={stats.diaryTasksTotal} accent="ice" />
        <StatCard label="Непрочитанные уведомления" value={stats.notificationsUnread} accent="heat" />
        <StatCard label="Регистрации за неделю" value={stats.usersWeek} />
        <StatCard label="Достижения в каталоге" value={stats.achievementsTotal} />
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 mb-8">
        <h2 className="font-heading text-lg mb-4">Эндпоинты</h2>
        <ul className="space-y-2 text-sm font-mono text-white/60">
          <li>
            <span className="text-lime">GET</span> {siteUrl}/api/v1/health
          </li>
          <li>
            <span className="text-lime">POST</span> {siteUrl}/api/v1/auth/login
          </li>
          <li>
            <span className="text-ice">GET</span> {siteUrl}/api/v1/feed
          </li>
        </ul>
        <p className="mt-4 text-xs text-white/35">
          Node {process.version} · env: {process.env.NODE_ENV}
        </p>
      </section>

      <BroadcastForm />
    </div>
  );
}
