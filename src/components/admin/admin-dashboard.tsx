"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Film,
  Flag,
  Gift,
  Heart,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
  Zap,
  CheckCircle2,
  Building2,
} from "lucide-react";
import type { AdminDashboardData } from "@/lib/admin/stats";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpi } from "@/components/admin/admin-kpi";
import { AdminAreaChart } from "@/components/admin/admin-area-chart";
import { AdminActivityStream } from "@/components/admin/admin-activity-stream";
import { AdminAlertQueue } from "@/components/admin/admin-alert-queue";
import { AdminHealthWidget } from "@/components/admin/admin-health-widget";
import { EngagementFunnel } from "@/components/charts/engagement-funnel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const quickActions = [
  { href: "/admin/users", label: "Пользователи", desc: "Роли · verify · репутация", icon: Users, accent: "lime" },
  { href: "/admin/posts", label: "Модерация", desc: "Скрыть · удалить · featured", icon: Activity, accent: "ice" },
  { href: "/admin/social", label: "Спор и соц", desc: "Duels · Вместе · Move", icon: Flag, accent: "heat" },
  { href: "/admin/wishlists", label: "Вишлисты", desc: "Surprise mode · lists", icon: Gift, accent: "gold" },
  { href: "/admin/reports", label: "Жалобы", desc: "Content reports", icon: Target, accent: "heat" },
  { href: "/admin/system", label: "Система", desc: "Push · API v38 · smoke", icon: Zap, accent: "lime" },
] as const;

function CommandHero({ data }: { data: AdminDashboardData }) {
  const reduced = useReducedMotion();
  const alerts = data.contentReportsTotal + data.pendingJoinRequests + data.pendingFriendships;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-glass-accent relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 admin-hero-grid"
    >
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-good">
              <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-good" />
              Command Center
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">v38 · prod</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl leading-[0.95]">
            Платформа
            <span className="text-lime"> в движе</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            {data.usersTotal.toLocaleString("ru-RU")} пользователей · {data.postsTotal.toLocaleString("ru-RU")} постов ·{" "}
            {data.diaryTasksTotal.toLocaleString("ru-RU")} дел в дневниках. Модерация, v38-сущности и health API в одном месте.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-black/30 ring-1 ring-white/[0.08] p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">24ч рег.</p>
            <p className="mt-1 font-heading text-3xl text-lime tabular-nums">+{data.usersToday}</p>
          </div>
          <div className="rounded-2xl bg-black/30 ring-1 ring-white/[0.08] p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Дела сегодня</p>
            <p className="mt-1 font-heading text-3xl text-ice tabular-nums">{data.tasksCompletedToday}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-heat/10 ring-1 ring-heat/25 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-heat">Alerts</p>
            <p className="mt-1 font-heading text-3xl text-heat tabular-nums">{alerts}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  const chartSeries = useMemo(() => [
    {
      key: "users",
      label: "Юзеры",
      data: data.signupsByDay,
      accent: "#C8FF57",
      glow: "drop-shadow(0 0 6px rgba(200,255,87,0.8))",
    },
    {
      key: "posts",
      label: "Посты",
      data: data.postsByDay,
      accent: "#00D9FF",
      glow: "drop-shadow(0 0 6px rgba(0,217,255,0.8))",
    },
    {
      key: "tasks",
      label: "Дела",
      data: data.tasksCompletedByDay,
      accent: "#8D7CFF",
      glow: "drop-shadow(0 0 6px rgba(141,124,255,0.8))",
    },
  ], [data.signupsByDay, data.postsByDay, data.tasksCompletedByDay]);

  const funnelStages = useMemo(() => [
    { label: "Пользователи", value: data.usersTotal },
    { label: "Дружбы", value: data.friendshipsTotal },
    { label: "Посты", value: data.postsTotal },
    { label: "Лайки", value: data.likesTotal },
    { label: "Дела выполнено", value: data.tasksDoneTotal },
  ], [data]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 800);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void refresh();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refresh]);

  const filteredCities = cityFilter
    ? data.usersByCity.filter((c) => c.city === cityFilter)
    : data.usersByCity;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Ops · ДВЖ Admin"
        title="Command Center"
        description="Динамический дашборд: метрики, модерация, v38 health и активность в реальном времени."
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-good sm:inline-flex">
              <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-good" />
              Live
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2 border-white/10 bg-white/[0.03]"
              onClick={() => void refresh()}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Sync
            </Button>
          </div>
        }
      />

      <p className="-mt-6 mb-6 text-[11px] text-muted-foreground font-mono">
        synced {formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true, locale: ru })} · ⌘R
      </p>

      <CommandHero data={data} />

      {/* Primary KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpi label="Пользователи" value={data.usersTotal} delta={data.usersToday} deltaLabel="за 24ч" href="/admin/users" icon={Users} spark={data.signupsByDay.map((d) => d.count)} />
        <AdminKpi label="Посты" value={data.postsTotal} delta={data.postsToday} deltaLabel="за 24ч" href="/admin/posts" icon={Activity} accent="ice" spark={data.postsByDay.map((d) => d.count)} delay={0.05} />
        <AdminKpi label="В ленте" value={data.featuredPosts} deltaLabel={`${data.hiddenPosts} скрыто`} href="/admin/feed" icon={Sparkles} delay={0.1} />
        <AdminKpi label="Челленджи" value={data.challengesTotal} deltaLabel={`${data.challengeParticipantsTotal} участников`} href="/admin/challenges" icon={Trophy} accent="heat" delay={0.15} />
      </div>

      {/* v38 ecosystem */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AdminKpi label="Вишлисты" value={data.wishlistsTotal} deltaLabel={`${data.wishlistSurpriseOn} surprise`} href="/admin/wishlists" icon={Gift} accent="gold" size="md" delay={0.18} />
        <AdminKpi label="Медиа" value={data.mediaTotal} href="/admin/media" icon={Film} accent="violet" delay={0.2} />
        <AdminKpi label="Споры" value={data.duelsTotal} href="/admin/social" icon={Flag} delay={0.22} />
        <AdminKpi label="Вместе" value={data.sharedGoalsTotal} href="/admin/social" icon={UserPlus} delay={0.24} />
        <AdminKpi label="Move join" value={data.pendingJoinRequests} href="/admin/social" icon={Target} accent="heat" delay={0.26} />
        <AdminKpi label="Календарь" value={data.calendarEventsTotal} href="/admin/calendar" icon={CalendarDays} accent="ice" delay={0.28} />
      </div>

      {/* Charts row */}
      <div className="mb-8 grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AdminAreaChart series={chartSeries} defaultKey="users" />
        </div>
        <div className="xl:col-span-5 space-y-4">
          <AdminAlertQueue data={data} />
          <AdminHealthWidget />
        </div>
      </div>

      {/* Funnel + engagement */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <EngagementFunnel
          title="Воронка вовлечения"
          subtitle="От регистрации до выполненных дел — здоровье соц-слоя"
          stages={funnelStages}
          className="admin-glass !bg-transparent"
        />
        <div className="admin-glass rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Engagement</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <Heart className="mx-auto h-5 w-5 text-lime" />
              <p className="mt-2 font-heading text-2xl tabular-nums">{data.likesTotal}</p>
              <p className="text-[10px] text-muted-foreground mt-1">лайков</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <MessageCircle className="mx-auto h-5 w-5 text-ice" />
              <p className="mt-2 font-heading text-2xl tabular-nums">{data.commentsTotal}</p>
              <p className="text-[10px] text-muted-foreground mt-1">комментов</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <Smartphone className="mx-auto h-5 w-5 text-heat" />
              <p className="mt-2 font-heading text-2xl tabular-nums">{data.pushDevicesTotal}</p>
              <p className="text-[10px] text-muted-foreground mt-1">push devices</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-good" />
              <span className="text-muted-foreground">Дела done</span>
              <span className="ml-auto font-bold tabular-nums">{data.tasksDoneTotal}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Клубы</span>
              <span className="ml-auto font-bold tabular-nums">{data.clubsTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity + quick */}
      <div className="mb-8 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AdminActivityStream activities={data.recentActivities} />
        </div>
        <div className="lg:col-span-5 admin-glass rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Quick ops</p>
          <div className="mt-4 grid gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 transition-all hover:border-lime/25 hover:bg-lime/[0.04]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/10 text-lime ring-1 ring-lime/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-lime transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables */}
      <Tabs defaultValue="users" className="mb-8">
        <TabsList className="mb-4 h-9 bg-white/[0.04] ring-1 ring-white/[0.06]">
          <TabsTrigger value="users" className="cursor-pointer text-xs">Новые юзеры</TabsTrigger>
          <TabsTrigger value="posts" className="cursor-pointer text-xs">Свежие посты</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="admin-glass overflow-hidden rounded-2xl divide-y divide-white/[0.04]">
            {data.recentUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users?q=${encodeURIComponent(u.username)}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{u.name}{u.verified && " ✓"}</p>
                  <p className="text-xs text-muted-foreground">@{u.username} · {u.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase">{u.role}</span>
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="posts">
          <div className="admin-glass overflow-hidden rounded-2xl divide-y divide-white/[0.04]">
            {data.recentPosts.map((p) => (
              <Link key={p.id} href="/admin/posts" className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{p.title ?? p.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">@{p.author.username} · {p.type} · {p.city}</p>
                </div>
                <div className="shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                  <p>♥ {p.likes}</p>
                  <p>💬 {p.comments}</p>
                  {p.hiddenFromFeed && <p className="text-heat font-bold">HIDDEN</p>}
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cities + types */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg">География</h3>
            {cityFilter && (
              <button type="button" onClick={() => setCityFilter(null)} className="text-xs text-lime cursor-pointer">Сброс</button>
            )}
          </div>
          <div className="space-y-3">
            {filteredCities.map((row) => {
              const max = Math.max(...data.usersByCity.map((c) => c.count), 1);
              const active = cityFilter === row.city;
              return (
                <button
                  key={row.city}
                  type="button"
                  onClick={() => setCityFilter(active ? null : row.city)}
                  className={cn(
                    "w-full text-left rounded-xl px-2 py-2 cursor-pointer transition-colors",
                    active ? "bg-lime/10 ring-1 ring-lime/25" : "hover:bg-white/[0.03]",
                  )}
                >
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{row.city}</span>
                    <span className="font-semibold tabular-nums text-lime">{row.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div className="h-full rounded-full bg-lime" animate={{ width: `${(row.count / max) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="admin-glass rounded-2xl p-5">
          <h3 className="mb-4 font-heading text-lg">Посты по типам</h3>
          <div className="grid grid-cols-2 gap-2">
            {data.postsByType.map((row) => (
              <Link key={row.type} href="/admin/posts" className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-ice/30 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{row.type}</p>
                <p className="mt-1 font-heading text-2xl tabular-nums text-ice">{row.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
