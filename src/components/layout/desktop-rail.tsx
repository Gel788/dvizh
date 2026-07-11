"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Flame, MapPin, Medal, Plus, Target, Users, Zap,
} from "lucide-react";
import { EngagementFunnel } from "@/components/charts/engagement-funnel";
import { spring, stagger } from "@/lib/motion-spring";
import { cn } from "@/lib/utils";

type RailStat = { value: string; label: string };

type DesktopRailProps = {
  city: string;
  username?: string;
  stats?: RailStat[];
};

const QUICK = [
  { href: "/nearby", label: "Рядом", icon: MapPin, accent: "text-ice" },
  { href: "/friends", label: "Друзья", icon: Users, accent: "text-lime" },
  { href: "/leaderboard", label: "Рейтинг", icon: Medal, accent: "text-lime" },
  { href: "/challenges", label: "Челленджи", icon: Target, accent: "text-heat" },
];

const HOT_TAGS = ["#бег", "#тусовка", "#volunteer", "#кофе", "#двор", "#ночь"];

function parseStatValue(v: string): number {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function DesktopRail({ city, username, stats }: DesktopRailProps) {
  const profileHref = username ? `/profile/${username}` : "/login";
  const s = stats ?? [
    { value: "—", label: "активных" },
    { value: "—", label: "рядом" },
    { value: "—", label: "онлайн" },
  ];

  const funnelStages = [
    { label: "В ленте", value: parseStatValue(s[2]?.value ?? "0") || 120 },
    { label: "Челленджи", value: parseStatValue(s[0]?.value ?? "0") || 48 },
    { label: "Рядом", value: parseStatValue(s[1]?.value ?? "0") || 24 },
    { label: "Действие", value: Math.max(8, Math.round((parseStatValue(s[2]?.value ?? "0") || 120) * 0.12)) },
  ];

  return (
    <div className="space-y-4 t-reveal">
      <div className="web-panel overflow-hidden p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Сводка · {city}
          </p>
          <span className="chip chip-lime text-[10px] py-0.5">{city}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {s.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.default, delay: i * stagger.fast }}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2.5 text-center"
            >
              <p className="font-heading text-xl text-lime leading-none t-number-pop">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <EngagementFunnel
        title="Воронка движа"
        subtitle="От просмотра ленты до реального действия в городе"
        stages={funnelStages}
      />

      <div className="web-panel p-3">
        <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Быстрый движ
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK.map(({ href, label, icon: Icon, accent }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.default, delay: i * stagger.fast }}
            >
              <Link
                href={href}
                className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs font-semibold text-foreground/80 hover:border-lime/25 hover:bg-lime/[0.04] hover:text-lime transition-colors cursor-pointer t-card-press"
              >
                <Icon className={cn("h-4 w-4 shrink-0", accent, "group-hover:scale-110 transition-transform")} />
                {label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="web-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-heat" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Горячие теги
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HOT_TAGS.map((tag, i) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.snappy, delay: 0.2 + i * 0.03 }}
            >
              <Link
                href={`/?tag=${encodeURIComponent(tag.replace("#", ""))}`}
                className="chip hover:border-lime/40 hover:bg-lime/[0.08] hover:text-lime transition-colors cursor-pointer"
              >
                {tag}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.15 }}
        className="web-panel-accent p-4 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-lime/20 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-lime" />
            <p className="font-heading text-lg text-neon-lime leading-none">ЗАПИСАТЬ</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Зафиксируй действие — район увидит, XP начислится.
          </p>
          <Link href="/create" className="btn-action w-full justify-center text-xs py-2.5 t-card-press">
            <Plus className="h-4 w-4" />
            Новое действие
          </Link>
          <Link
            href={profileHref}
            className="mt-2 flex w-full items-center justify-center rounded-xl border border-white/[0.08] py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-lime hover:border-lime/30 transition-colors cursor-pointer"
          >
            Мой профиль
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
