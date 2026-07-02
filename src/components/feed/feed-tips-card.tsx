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
    <section className="space-y-2.5">
      <h2 className="text-sm font-extrabold text-foreground px-0.5">Подсказки дня</h2>
      <div className="card-surface flex items-center gap-3 p-3.5 rounded-[20px]">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-lime/10 border border-lime/20 grid place-items-center text-xl">
          {tip.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tip.imageUrl} alt="" className="h-full w-full object-cover rounded-2xl" />
          ) : (
            "✨"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">{tip.title}</p>
          {tip.subtitle && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{tip.subtitle}</p>
          )}
        </div>
        {tip.href ? (
          <Link
            href={tip.href}
            className="shrink-0 rounded-full bg-lime/15 border border-lime/25 px-3 py-1.5 text-[11px] font-extrabold text-lime hover:bg-lime/20 transition-colors"
          >
            смотреть
          </Link>
        ) : null}
      </div>
    </section>
  );
}
