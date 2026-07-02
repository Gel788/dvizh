import Link from "next/link";
import { Search } from "lucide-react";

export function FeedHero() {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[25px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--ref-ink)]">
          Лента
        </h1>
        <p className="text-[10.5px] font-bold ref-muted mt-1">живые события друзей и района</p>
      </div>
      <Link href="/search" className="ref-round-btn shrink-0" aria-label="Поиск">
        <Search className="h-[18px] w-[18px]" />
      </Link>
    </header>
  );
}
