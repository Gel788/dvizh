"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, Compass, Sun, Trophy, User, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { RefCreateSheet } from "./ref-create-sheet";

const TABS = [
  { href: "/", label: "Лента", icon: BookOpen, exact: true },
  { href: "/nearby", label: "Движ", icon: Compass, exact: false },
  { href: "/today", label: "Сегодня", icon: Sun, exact: false },
  { href: "/challenges", label: "Вызовы", icon: Trophy, exact: false },
  { href: (u?: string) => u ? `/profile/${u}` : "/login", label: "Профиль", icon: User, exact: false },
] as const;

export function RefMobileShell({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const base = pathname.split("?")[0];

  const isRefRoute = base === "/" || base === "/today";
  if (!isRefRoute) return null;

  return (
    <>
      {user && (
        <>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="ref-mobile-fab lg:hidden fixed left-1/2 z-[55] -translate-x-1/2 flex h-[60px] w-[60px] items-center justify-center rounded-[24px] cursor-pointer active:scale-95 transition-transform"
            style={{
              bottom: "calc(74px + env(safe-area-inset-bottom, 0px) + 8px)",
              background: "linear-gradient(135deg, #f0cf2c, #98c84a)",
              border: "5px solid rgba(255,253,248,0.96)",
              boxShadow: "0 14px 30px rgba(145,168,38,0.35)",
            }}
            aria-label="Создать"
          >
            <Plus className="h-[34px] w-[34px] text-[var(--ref-ink)]" strokeWidth={2.5} />
          </button>
          <RefCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} username={user.username} />
        </>
      )}

      <nav className="ref-mobile-shell lg:hidden fixed inset-x-0 bottom-0 z-50 px-[15px] pb-[calc(13px+env(safe-area-inset-bottom,0px))] pointer-events-none">
        <div
          className="pointer-events-auto flex h-[74px] items-stretch gap-0 rounded-[28px] border border-[var(--ref-line)] p-[7px]"
          style={{
            background: "rgba(255,253,248,0.95)",
            boxShadow: "0 -12px 35px rgba(70,51,32,0.13)",
          }}
        >
          {TABS.map((tab) => {
            const href = typeof tab.href === "function" ? tab.href(user?.username) : tab.href;
            const tabBase = href.split("?")[0];
            const active = tab.exact
              ? base === tabBase
              : base === tabBase || (tabBase !== "/" && base.startsWith(tabBase));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-[3px] rounded-[21px] border transition-colors duration-200",
                  active
                    ? "border-[#e7efca] bg-[#f2f9d9] text-[#3b2a22]"
                    : "border-transparent text-[#8b8078]",
                )}
              >
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[10.5px] font-extrabold leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
