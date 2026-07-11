import { BroadcastForm } from "@/components/admin/broadcast-form";
import { StatCard } from "@/components/admin/stat-card";
import { getAdminStats } from "@/lib/admin/stats";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const v38Endpoints = [
  { method: "GET", path: "/api/v1/health", note: "healthcheck" },
  { method: "GET", path: "/api/v1/feed", note: "лента + privacy filter" },
  { method: "GET", path: "/api/v1/pulse", note: "пульс v38" },
  { method: "GET", path: "/api/v1/search", note: "без private dispute/together" },
  { method: "GET", path: "/api/v1/move/activities", note: "Движ карта" },
  { method: "POST", path: "/api/v1/move/activities/:id/join", note: "вступить" },
  { method: "POST", path: "/api/v1/move/activities/:id/feed-publication", note: "публикация в ленту" },
  { method: "GET", path: "/api/v1/diary/calendar", note: "календарь" },
  { method: "GET", path: "/api/v1/wishlists", note: "вишлисты + surprise" },
  { method: "GET", path: "/api/v1/duels", note: "спор (private)" },
  { method: "GET", path: "/api/v1/shared-goals", note: "вместе" },
  { method: "GET", path: "/api/v1/friends", note: "друзья v38" },
  { method: "GET", path: "/api/v1/notifications", note: "inbox" },
  { method: "PATCH", path: "/api/v1/notifications", note: "read all / by ids" },
  { method: "DELETE", path: "/api/v1/posts/:id", note: "удаление поста" },
  { method: "GET", path: "/api/v1/profile", note: "social fields + uploads" },
] as const;

export default async function AdminSystemPage({ searchParams }: Props) {
  const stats = await getAdminStats();
  const sp = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://www.flroal.ru";

  const pushSent = Number(sp.push_sent ?? 0);
  const pushFailed = Number(sp.push_failed ?? 0);
  const pushDevices = Number(sp.push_devices ?? 0);
  const hasPushResult = sp.push_sent != null;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[900px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Система</h1>
        <p className="mt-2 text-sm text-white/45">Сервисы, рассылки, v38 API и диагностика</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <StatCard label="Задачи дневника" value={stats.diaryTasksTotal} accent="ice" />
        <StatCard label="Календарь (личный)" value={stats.calendarEventsTotal} accent="ice" />
        <StatCard label="Непрочитанные уведомления" value={stats.notificationsUnread} accent="heat" />
        <StatCard label="Push-устройства" value={stats.pushDevicesTotal} accent="lime" />
        <StatCard label="Заявки в друзья" value={stats.pendingFriendships} accent="heat" />
        <StatCard label="Жалобы (всего)" value={stats.contentReportsTotal} accent="heat" />
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 mb-8">
        <h2 className="font-heading text-lg mb-1">API v38 (launch slice)</h2>
        <p className="text-xs text-white/35 mb-4">База: {siteUrl}</p>
        <ul className="space-y-2 text-sm font-mono text-white/60 max-h-72 overflow-y-auto">
          {v38Endpoints.map((ep) => (
            <li key={ep.path}>
              <span className="text-lime">{ep.method}</span> {siteUrl}{ep.path}
              <span className="text-white/30 ml-2">— {ep.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-white/35">
          Smoke: <code className="text-lime/80">bash scripts/v38-acceptance-smoke.sh</code> · Node {process.version} · {process.env.NODE_ENV}
        </p>
      </section>

      <BroadcastForm
        pushDevices={stats.pushDevicesTotal}
        pushResult={
          hasPushResult
            ? {
                sent: pushSent,
                failed: pushFailed,
                devices: pushDevices,
                configured: sp.push_ok === "1",
              }
            : null
        }
      />
    </div>
  );
}
