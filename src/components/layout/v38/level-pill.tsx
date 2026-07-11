"use client";

import Link from "next/link";
import { levelInfo } from "@/components/profile/profile-data";
import { cn } from "@/lib/utils";

export function LevelPill({
  xp,
  username,
  className,
}: {
  xp: number;
  username: string;
  className?: string;
}) {
  const { level } = levelInfo(xp);

  return (
    <Link
      href={`/profile/${username}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1",
        "text-[11px] font-extrabold text-foreground shadow-sm hover:border-lime/50 transition-colors cursor-pointer",
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[10px] text-lime-foreground">
        {level}
      </span>
      <span className="text-muted-foreground font-semibold">ур.</span>
    </Link>
  );
}
