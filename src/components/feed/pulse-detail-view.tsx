"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Swords, Trophy, Users, Zap } from "lucide-react";

type PulseScopes = {
  friends: { label: string; steps: number; active: number };
  district: { label: string; steps: number; growth: number };
  city: { label: string; users: number; events: number };
  challenges: { label: string; participants: number };
  events: { label: string; count: number };
};

const TABS = [
  { id: "friends", label: "Друзья", icon: Users },
  { id: "district", label: "Район", icon: MapPin },
  { id: "city", label: "Город", icon: Zap },
  { id: "events", label: "События", icon: MapPin },
  { id: "challenges", label: "Вызовы", icon: Trophy },
] as const;

type TabId = (typeof TABS)[number]["id"];

function formatK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function formatM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
      <p className="text-2xl font-heading leading-none">{value}</p>
      <p className="mt-2 text-xs font-bold text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export function PulseDetailView({
  pulse,
  initialTab,
}: {
  pulse: { city: string; metrics: { icon: string; value: string; label: string }[]; scopes: PulseScopes };
  initialTab?: string;
}) {
  const params = useSearchParams();
  const tabParam = params.get("tab") ?? initialTab ?? "friends";
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "friends";
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const { scopes, city, metrics } = pulse;

  useEffect(() => {
    const el = tabRefs.current[tab];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-[22px] p-5 text-white"
        style={{ background: "linear-gradient(135deg, #1a1528 0%, #2d4a3e 55%, #1a2838 100%)" }}
      >
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-white/15 px-2 py-0.5 rounded-full mb-2">
          сегодня
        </span>
        <h2 className="font-heading text-2xl">{city}</h2>
        <p className="text-sm text-white/70 mt-1">Сводка по друзьям, району и городу — без твоих личных задач</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-white/10 px-3 py-2 border border-white/10">
              <p className="text-base font-heading">{m.icon} {m.value}</p>
              <p className="text-[10px] text-white/65 font-semibold">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-none">
        <div className="t-tabs shrink-0 inline-flex min-w-full">
          <span className="t-tabs__indicator" style={{ left: indicator.left, width: indicator.width }} aria-hidden />
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            const href = id === "friends" ? "/pulse" : `/pulse?tab=${id}`;
            return (
              <Link
                key={id}
                ref={(el) => { tabRefs.current[id] = el; }}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap",
                  active ? "text-lime-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {tab === "friends" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Stat label="Шагов у друзей" value={formatK(scopes.friends.steps)} hint="Агрегат по подпискам и активности" />
          <Stat label="Друзей в движе" value={String(scopes.friends.active)} hint="Принятые дружбы в сети" />
          <Link href="/friends" className="sm:col-span-2 rounded-2xl border border-lime/30 bg-lime/5 px-4 py-3 text-sm font-bold text-lime hover:bg-lime/10 transition-colors">
            Открыть ленту друзей →
          </Link>
        </div>
      )}

      {tab === "district" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Stat label="Шагов в районе" value={formatM(scopes.district.steps)} />
          <Stat label="Рост активности" value={`+${scopes.district.growth}%`} hint="За сегодня относительно вчера" />
          <Link href="/dvizh?scope=district" className="sm:col-span-2 rounded-2xl border border-ice/30 bg-ice/5 px-4 py-3 text-sm font-bold text-ice hover:bg-ice/10 transition-colors">
            Смотреть на карте Движ →
          </Link>
        </div>
      )}

      {tab === "city" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Stat label="Людей в городе" value={String(scopes.city.users)} />
          <Stat label="Событий в городе" value={String(scopes.city.events)} />
          <Link href="/leaderboard" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold hover:border-lime/30 transition-colors">
            Рейтинг города →
          </Link>
          <Link href="/challenges" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold hover:border-heat/30 transition-colors">
            Вызовы города →
          </Link>
        </div>
      )}

      {tab === "events" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Stat label="Событий рядом" value={String(scopes.events.count)} hint="Предстоящие в твоём городе" />
          <Link href="/nearby" className="sm:col-span-2 rounded-2xl border border-ice/30 bg-ice/5 px-4 py-3 text-sm font-bold text-ice hover:bg-ice/10 transition-colors flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Открыть Движ · Рядом
          </Link>
        </div>
      )}

      {tab === "challenges" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Stat label="Участников сегодня" value={String(scopes.challenges.participants)} />
          <Link href="/challenges" className="sm:col-span-2 rounded-2xl border border-heat/30 bg-heat/5 px-4 py-3 text-sm font-bold text-heat hover:bg-heat/10 transition-colors flex items-center gap-2">
            <Swords className="h-4 w-4" /> Все вызовы
          </Link>
          <Link href="/friends?view=duels" className="sm:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold hover:border-lime/30 transition-colors">
            Споры с друзьями →
          </Link>
        </div>
      )}
    </div>
  );
}
