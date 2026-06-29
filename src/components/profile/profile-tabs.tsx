"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProfileTab } from "./profile-view";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "diary", label: "Дневник" },
  { id: "achievements", label: "Ачивки" },
  { id: "duels", label: "Споры" },
  { id: "wishlists", label: "Вишлисты" },
  { id: "media", label: "Медиа" },
  { id: "privacy", label: "Приватность" },
];

export function ProfileTabs({ username, activeTab }: { username: string; activeTab: string }) {
  const base = `/profile/${username}`;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
      {tabs.map(({ id, label }) => {
        const active = activeTab === id;
        return (
          <Link
            key={id}
            href={id === "diary" ? base : `${base}?tab=${id}`}
            className={cn(
              "shrink-0 px-3.5 py-2 rounded-[11px] text-xs font-bold border transition-colors",
              active
                ? "bg-lime text-lime-foreground border-lime"
                : "bg-card border-white/[0.07] text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
