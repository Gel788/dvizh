"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Bell, Home, Compass, Sun, Trophy, User, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { V38_MAIN_TABS, V38_QUICK_ITEMS, profileHref } from "@/lib/v38-nav";
import { CreateMenuButton } from "./create-menu";

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

export function Sidebar({ user, unreadCount = 0 }: { user: SessionUser | null; unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-[248px] xl:w-[260px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/" className="group flex items-center gap-3 cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime shrink-0">
            <span className="font-heading text-[18px] text-lime-foreground leading-none -skew-x-6">Д</span>
          </div>
          <div>
            <span className="font-heading text-[20px] text-foreground -skew-x-3 leading-none">ДВЖ</span>
            <p className="text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-semibold mt-0.5">
              реальные действия
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {V38_MAIN_TABS.map((tab, i) => {
          const href = tabHref(tab, user?.username);
          const active = isTabActive(pathname, tab, user?.username);
          const Icon = TAB_ICONS[i];
          return (
            <Link key={tab.label} href={href} className="relative block cursor-pointer group">
              {active && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl bg-sidebar-accent"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(185,244,0,0.15)" }}
                  transition={{ type: "spring", stiffness: 440, damping: 32 }}
                />
              )}
              <span className={cn(
                "relative flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground group-hover:bg-muted/50",
              )}>
                <Icon className="h-[16px] w-[16px] shrink-0" />
                {tab.label}
              </span>
            </Link>
          );
        })}

        <div className="pt-3 mt-2 border-t border-sidebar-border">
          <p className="px-3.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Быстрый доступ</p>
          {V38_QUICK_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
            >
              <span className="text-base leading-none">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-2 pb-4 pt-2 border-t border-sidebar-border space-y-0.5">
        {user ? (
          <>
            <CreateMenuButton user={user} />
            <Link
              href="/notifications"
              className="relative flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="h-[16px] w-[16px]" />
              Уведомления
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-heat px-1.5 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-colors cursor-pointer",
                  pathname.startsWith("/admin")
                    ? "text-heat bg-heat/10"
                    : "text-muted-foreground hover:text-heat hover:bg-heat/10",
                )}
              >
                <Shield className="h-[16px] w-[16px]" />
                Админ
              </Link>
            )}
          </>
        ) : (
          <Link href="/login" className="btn-action w-full justify-center py-2.5 text-xs gap-2">
            Войти
          </Link>
        )}
      </div>
    </aside>
  );
}

/** @deprecated use V38BottomNav */
export function MobileNav() {
  return null;
}
