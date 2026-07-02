"use client";

import Link from "next/link";

type Tip = {
  title: string;
  subtitle?: string;
  href?: string;
  imageUrl?: string;
};

export function FeedTipsCard({ tips }: { tips: Tip[] }) {
  if (!tips.length) return null;
  const tip = tips[0];

  return (
    <section className="pt-4">
      <h2 className="text-[22px] font-extrabold text-[var(--ref-ink,#33251f)] mb-2.5">Подсказки дня</h2>
      <div className="ref-card flex items-center gap-3 p-3 rounded-[19px]">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--ref-green-soft,#eff9dc)] border border-[#dcecc8] grid place-items-center text-xl">
          {tip.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tip.imageUrl} alt="" className="h-full w-full object-cover rounded-2xl" />
          ) : (
            "🌆"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14.5px] leading-snug text-[var(--ref-ink,#33251f)]">{tip.title}</p>
          {tip.subtitle && (
            <p className="text-[12px] font-semibold ref-muted mt-1 leading-relaxed line-clamp-2">{tip.subtitle}</p>
          )}
        </div>
        {tip.href ? (
          <Link href={tip.href} className="ref-chip ref-chip-green shrink-0 px-3 py-1.5">
            смотреть
          </Link>
        ) : (
          <span className="ref-chip ref-chip-green shrink-0 px-3 py-1.5">смотреть</span>
        )}
      </div>
    </section>
  );
}
