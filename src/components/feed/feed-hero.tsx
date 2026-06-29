import Link from "next/link";
import { Bell, Plus } from "lucide-react";

type FeedHeroProps = {
  city: string;
  subtitle?: string;
};

const TICKER = [
  "🔥 Новый челлендж в районе",
  "📍 12 человек рядом сейчас",
  "🏆 Рейтинг обновится через 4 дня",
  "✨ Дайджест дня готов",
  "⚡ Спонсорский ивент в субботу",
];

export function FeedHero({ city, subtitle = "То, что движет городом прямо сейчас" }: FeedHeroProps) {
  const marquee = [...TICKER, ...TICKER].join("   ·   ");

  return (
    <header className="relative overflow-hidden rounded-[28px] border border-lime/20 px-6 py-7 lg:px-8 lg:py-9 mb-5 desktop-hero">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(200,255,87,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-heat/[0.1] blur-3xl" />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="chip chip-lime text-[10px] animate-pulse">Live · {city}</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
              Лента активна
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-neon-lime leading-[0.95]">
            ЛЕНТА
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-md">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/notifications"
            className="hidden sm:grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.08] bg-card/80 text-foreground hover:border-lime/30 hover:text-lime transition-colors cursor-pointer"
            aria-label="Уведомления"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link href="/create" className="btn-action h-11 px-5 text-xs shadow-[0_8px_28px_rgba(200,255,87,0.25)]">
            <Plus className="h-4 w-4" />
            Записать
          </Link>
        </div>
      </div>
      <div className="relative z-10 mt-5 overflow-hidden rounded-xl border border-white/[0.06] bg-black/30 py-2">
        <div className="marquee-inner whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-lime/80">
          {marquee}
        </div>
      </div>
    </header>
  );
}
