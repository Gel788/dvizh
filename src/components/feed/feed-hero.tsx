import Link from "next/link";
import { Search } from "lucide-react";

type FeedHeroProps = {
  city: string;
  subtitle?: string;
};

export function FeedHero({
  city,
  subtitle = "живые события друзей и района",
}: FeedHeroProps) {
  return (
    <header className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h1 className="font-heading text-[28px] sm:text-[32px] leading-none tracking-tight text-foreground">
          Лента
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1.5">{subtitle}</p>
        <p className="text-[11px] font-bold text-lime/80 mt-1 uppercase tracking-wide">{city}</p>
      </div>
      <Link
        href="/search"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-card text-muted-foreground hover:text-lime hover:border-lime/25 transition-colors"
        aria-label="Поиск"
      >
        <Search className="h-[18px] w-[18px]" />
      </Link>
    </header>
  );
}
