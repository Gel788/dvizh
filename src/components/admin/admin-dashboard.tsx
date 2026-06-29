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
  EyeOff,
  Heart,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import type { AdminDashboardData } from "@/lib/admin/stats";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MiniChart({
  data,
  accent = "lime",
  activeIndex,
  onHover,
}: {
  data: { label: string; count: number }[];
  accent?: "lime" | "ice" | "heat";
  activeIndex: number | null;
  onHover: (i: number | null) => void;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barColor = { lime: "bg-lime", ice: "bg-ice", heat: "bg-heat" }[accent];
  const glow = { lime: "shadow-[0_0_12px_rgba(200,255,87,0.45)]", ice: "shadow-[0_0_12px_rgba(0,217,255,0.35)]", heat: "shadow-[0_0_12px_rgba(255,45,85,0.35)]" }[accent];

  return (
    <div className="flex h-32 items-end gap-1.5 sm:gap-2">
      {data.map((d, i) => {
        const h = Math.max(8, (d.count / max) * 100);
        const active = activeIndex === i;
        return (
          <button
            key={d.label + i}
            type="button"
            className="group relative flex flex-1 flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/50 rounded-md"
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(i)}
            onBlur={() => onHover(null)}
            aria-label={`${d.label}: ${d.count}`}
          >
            <div className="relative flex h-24 w-full items-end justify-center">
              <motion.div
                className={cn("w-full max-w-[28px] rounded-t-md", barColor, active && glow)}
                initial={false}
                animate={{ height: `${h}%`, opacity: active || activeIndex === null ? 1 : 0.45 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
              {active && (
                <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-popover px-2 py-1 text-xs font-semibold tabular-nums shadow-lg">
                  {d.count}
                </div>
              )}
            </div>
            <span className={cn("text-[10px] font-semibold uppercase", active ? "text-foreground" : "text-muted-foreground")}>
              {d.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  href,
  icon: Icon,
  accent = "lime",
  delay = 0,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "lime" | "ice" | "heat" | "muted";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const colors = {
    lime: "text-lime ring-lime/20 bg-lime/10",
    ice: "text-ice ring-ice/20 bg-ice/10",
    heat: "text-heat ring-heat/20 bg-heat/10",
    muted: "text-foreground ring-white/10 bg-white/[0.04]",
  }[accent];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="admin-stat group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-card/50 p-4 ring-1 ring-white/[0.03] transition-all hover:border-white/[0.14] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl tabular-nums leading-none">{value}</p>
            {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", colors)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-lime">
          Управлять <ArrowUpRight className="h-3 w-3" />
        </span>
      </Link>
    </motion.div>
  );
}

const quickActions = [
  { href: "/admin/users", label: "Пользователи", desc: "Роли, verify, репутация", icon: Users },
  { href: "/admin/posts", label: "Модерация постов", desc: "Скрыть, удалить, проверить", icon: Activity },
  { href: "/admin/feed", label: "Курация ленты", desc: "Boost и закрепления", icon: Sparkles },
  { href: "/admin/system", label: "Рассылка", desc: "Push всем пользователям", icon: Zap },
] as const;

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [chartTab, setChartTab] = useState<"users" | "posts">("users");
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  const chartData = chartTab === "users" ? data.signupsByDay : data.postsByDay;
  const chartTotal = chartData.reduce((s, d) => s + d.count, 0);

  const filteredCities = useMemo(() => {
    if (!cityFilter) return data.usersByCity;
    return data.usersByCity.filter((c) => c.city === cityFilter);
  }, [cityFilter, data.usersByCity]);

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

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Панель управления"
        title="Обзор"
        description="Интерактивный дашборд — метрики, модерация и активность платформы."
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-good sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
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
              Обновить
            </Button>
          </div>
        }
      />

      <p className="-mt-4 mb-6 text-[11px] text-muted-foreground">
        Обновлено {formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true, locale: ru })} · ⌘R
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Пользователи" value={data.usersTotal} hint={`+${data.usersToday} за 24ч`} href="/admin/users" icon={Users} delay={0} />
        <MetricTile label="Посты" value={data.postsTotal} hint={`+${data.postsToday} за 24ч`} href="/admin/posts" icon={Activity} accent="ice" delay={0.05} />
        <MetricTile label="В ленте" value={data.featuredPosts} hint={`${data.hiddenPosts} скрыто`} href="/admin/feed" icon={Sparkles} accent="lime" delay={0.1} />
        <MetricTile label="Челленджи" value={data.challengesTotal} href="/admin/challenges" icon={Trophy} accent="heat" delay={0.15} />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl border border-white/[0.07] bg-card/40 p-5 ring-1 ring-white/[0.03]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg">Динамика за 7 дней</h2>
              <p className="text-xs text-muted-foreground">
                {chartTab === "users" ? "Регистрации" : "Новые посты"} · всего {chartTotal}
              </p>
            </div>
            <Tabs value={chartTab} onValueChange={(v) => setChartTab(v as "users" | "posts")}>
              <TabsList className="h-8 bg-white/[0.04]">
                <TabsTrigger value="users" className="cursor-pointer text-xs px-3">Юзеры</TabsTrigger>
                <TabsTrigger value="posts" className="cursor-pointer text-xs px-3">Посты</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <MiniChart
            data={chartData}
            accent={chartTab === "users" ? "lime" : "ice"}
            activeIndex={hoverBar}
            onHover={setHoverBar}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="rounded-2xl border border-heat/20 bg-heat/5 p-4 ring-1 ring-heat/10">
            <div className="flex items-center gap-2 text-heat">
              <EyeOff className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Модерация</span>
            </div>
            <p className="mt-2 font-heading text-3xl tabular-nums">{data.hiddenPosts}</p>
            <p className="text-xs text-muted-foreground">скрытых постов</p>
            <Link href="/admin/posts" className="mt-3 inline-flex text-xs font-semibold text-heat hover:underline">
              Открыть очередь →
            </Link>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-card/40 p-4 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Быстрые действия</p>
            <ul className="mt-3 space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-lime" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{a.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{a.desc}</span>
                    </span>
                  </Link>
                </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <Tabs defaultValue="activity" className="mb-8">
        <TabsList className="mb-4 h-9 bg-white/[0.04]">
          <TabsTrigger value="activity" className="cursor-pointer text-xs">Активность</TabsTrigger>
          <TabsTrigger value="users" className="cursor-pointer text-xs">Новые юзеры</TabsTrigger>
          <TabsTrigger value="posts" className="cursor-pointer text-xs">Посты</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="rounded-2xl border border-white/[0.07] bg-card/30 divide-y divide-white/[0.05]">
          {data.recentActivities.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Пока нет активности</p>
          ) : (
            data.recentActivities.map((a) => (
              <div key={a.id} className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/10 text-[10px] font-bold text-lime">
                  {a.type.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <Link href={`/profile/${a.user.username}`} className="hover:text-lime">
                      {a.user.name}
                    </Link>
                    {" · "}
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ru })}
                  </p>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-card/30">
            {data.recentUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users?q=${encodeURIComponent(u.username)}`}
                className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{u.role}</span>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-card/30">
            {data.recentPosts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/posts`}
                className="flex items-start justify-between gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{p.title ?? p.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">@{p.author.username} · {p.type}</p>
                </div>
                <div className="shrink-0 text-right text-[10px] text-muted-foreground">
                  <p>♥ {p.likes}</p>
                  <p>💬 {p.comments}</p>
                  {p.hiddenFromFeed && <p className="text-heat font-bold">скрыт</p>}
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-card/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg">Города</h3>
            {cityFilter && (
              <button type="button" onClick={() => setCityFilter(null)} className="text-xs text-lime cursor-pointer">
                Сбросить
              </button>
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
                    "w-full text-left rounded-xl px-2 py-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40",
                    active ? "bg-lime/10 ring-1 ring-lime/25" : "hover:bg-white/[0.03]",
                  )}
                >
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{row.city}</span>
                    <span className="font-semibold tabular-nums text-lime">{row.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full bg-lime"
                      initial={false}
                      animate={{ width: `${(row.count / max) * 100}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          {cityFilter && (
            <Link
              href={`/admin/users?q=${encodeURIComponent(cityFilter)}`}
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-lime"
            >
              Пользователи в {cityFilter} <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-card/40 p-5">
          <h3 className="mb-4 font-heading text-lg">Посты по типам</h3>
          <div className="grid grid-cols-2 gap-2">
            {data.postsByType.map((row) => (
              <Link
                key={row.type}
                href="/admin/posts"
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-ice/30 hover:bg-ice/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{row.type}</p>
                <p className="mt-1 font-heading text-2xl tabular-nums text-ice">{row.count}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-4">
            <div className="text-center">
              <Heart className="mx-auto h-4 w-4 text-lime" />
              <p className="mt-1 text-lg font-bold tabular-nums">{data.likesTotal}</p>
              <p className="text-[10px] text-muted-foreground">лайков</p>
            </div>
            <div className="text-center">
              <MessageCircle className="mx-auto h-4 w-4 text-ice" />
              <p className="mt-1 text-lg font-bold tabular-nums">{data.commentsTotal}</p>
              <p className="text-[10px] text-muted-foreground">комментов</p>
            </div>
            <div className="text-center">
              <UserPlus className="mx-auto h-4 w-4 text-heat" />
              <p className="mt-1 text-lg font-bold tabular-nums">{data.usersWeek}</p>
              <p className="text-[10px] text-muted-foreground">за неделю</p>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
