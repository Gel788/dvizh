"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type FeedEventTileProps = {
  href: string;
  avatarUrl?: string | null;
  avatarFallback: string;
  title: string;
  subtitle: string;
  chips?: string[];
  className?: string;
};

export function FeedEventTile({
  href,
  avatarUrl,
  avatarFallback,
  title,
  subtitle,
  chips = [],
  className,
}: FeedEventTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "ref-card ref-card-hover flex items-center gap-2.5 p-3 my-1 transition-transform",
        className,
      )}
    >
      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-[var(--ref-line)]">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback className="bg-[var(--ref-green-soft)] text-[var(--ref-green-dark)] text-xs font-extrabold">
          {avatarFallback.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14.5px] leading-snug text-[var(--ref-ink)]">{title}</p>
        <p className="text-[12px] font-semibold ref-muted mt-0.5 line-clamp-2">{subtitle}</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {chips.map((c) => (
              <span key={c} className="ref-chip ref-chip-neutral">{c}</span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#bab0a7]" aria-hidden />
    </Link>
  );
}
