"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Home, Compass, Sun, Trophy, User, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { V38_MAIN_TABS, V38_QUICK_ITEMS, profileHref } from "@/lib/v38-nav";
import { CreateMenuModal } from "@/components/layout/create-menu";

const TAB_ICONS = [Home, Compass, Sun, Trophy, User] as const;

function tabHref(tab: (typeof V38_MAIN_TABS)[number], username?: string) {
  if ("profile" in tab && tab.profile) return profileHref(username);
  return tab.href;
}

function isTabActive(pathname: string, tab: (typeof V38_MAIN_TABS)[number], username?: string) {
  const href = tabHref(tab, username);
  const base = href.split("?")[0];
  if (tab.exact) return pathname === base;
  if (base.startsWith("/profile")) return pathname.startsWith("/profile");
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isQuickActive(pathname: string, search: string, key: string) {
  if (key === "calendar") return pathname === "/today" && search.includes("view=calendar");
  if (key === "media") return pathname === "/media";
  if (key === "wishlist") return pathname === "/wishlist";
  if (key === "dispute") return pathname === "/friends" && search.includes("view=duels");
  if (key === "together") return pathname === "/friends" && search.includes("view=together");
  return false;
}

export function V38BottomNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const search = searchParams.toString();

  if (!user) return null;

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe">
        <div className="mx-3.5 mb-1.5 space-y-1.5">
          {/* quick row + FAB */}
          <div className="flex items-end gap-2.5">
            <div className="flex-1 flex gap-0.5 rounded-[22px] border border-border bg-card p-1 shadow-[0_8px_18px_rgba(16,19,15,0.06)]">
              {V38_QUICK_ITEMS.map((item) => {
                const active = isQuickActive(pathname, search, item.key);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-[17px] min-w-0 transition-colors cursor-pointer",
                      active ? "bg-[var(--black-card)]" : "hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-sm border",
                        active ? "bg-lime border-lime" : "bg-card border-border",
                      )}
                    >
                      {item.emoji}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] font-bold truncate max-w-full px-0.5",
                        active ? "text-white" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="shrink-0 flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-lime text-lime-foreground shadow-[0_10px_24px_rgba(185,244,0,0.35)] cursor-pointer active:scale-95 transition-transform"
              aria-label="Создать"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>

          {/* main tabs */}
          <div className="flex rounded-[29px] border border-border bg-card px-2 py-1 shadow-[0_8px_18px_rgba(16,19,15,0.08)]">
            {V38_MAIN_TABS.map((tab, i) => {
              const href = tabHref(tab, user.username);
              const active = isTabActive(pathname, tab, user.username);
              const Icon = TAB_ICONS[i];
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer select-none",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full transition-all duration-180",
                      active ? "h-10 w-10 bg-[var(--black-card)] shadow-[0_0_14px_rgba(185,244,0,0.22)]" : "h-8 w-8",
                    )}
                  >
                    <Icon className={cn("shrink-0", active ? "h-[22px] w-[22px] text-lime" : "h-5 w-5")} strokeWidth={active ? 2.25 : 1.75} />
                  </span>
                  <span className={cn("text-[9px] font-bold leading-none", active && "text-foreground")}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <CreateMenuModal open={createOpen} onClose={() => setCreateOpen(false)} username={user.username} />
    </>
  );
}
