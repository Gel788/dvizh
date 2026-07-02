import Link from "next/link";
import { Search } from "lucide-react";

type FeedHeroProps = {
  city?: string;
  subtitle?: string;
};

export function FeedHero({
  subtitle = "живые события друзей и района",
}: FeedHeroProps) {
  return (
    <header className="flex items-start justify-between gap-3 mb-3.5">
      <div className="min-w-0">
        <h1 className="text-[25px] font-extrabold leading-none tracking-tight text-[var(--ref-ink,#33251f)]">
          Лента
        </h1>
        <p className="text-[10.5px] font-bold ref-muted mt-1.5 uppercase tracking-wide">{subtitle}</p>
      </div>
      <Link href="/search" className="ref-round-btn shrink-0" aria-label="Поиск">
        <Search className="h-[18px] w-[18px]" />
      </Link>
    </header>
  );
}
