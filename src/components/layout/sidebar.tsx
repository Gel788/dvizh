"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Bell, Home, Compass, Sun, Trophy, Shield, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import type { ElementType } from "react";
import { CreateMenuButton } from "./create-menu";

function buildNav(username?: string) {
  const profileHref = username ? `/profile/${username}` : "/login";
  return [
    { href: "/", label: "Лента", icon: Home, exact: true as const },
    { href: "/nearby", label: "Движ", icon: Compass, exact: false as const },
    { href: username ? "/today" : "/login", label: "Сегодня", icon: Sun, exact: false as const },
    { href: "/challenges", label: "Вызовы", icon: Trophy, exact: false as const },
    { href: profileHref, label: "Профиль", icon: Zap, exact: false as const },
  ];
}

export function Sidebar({ user, unreadCount = 0 }: { user: SessionUser | null; unreadCount?: number }) {
  const pathname = usePathname();
  const nav = buildNav(user?.username);

  return (
    <aside className="hidden lg:flex w-[248px] xl:w-[260px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/" className="group flex items-center gap-3 cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime shrink-0">
            <span className="font-heading text-[18px] text-lime-foreground leading-none -skew-x-6">Д</span>
          </div>
          <div>
            <span className="font-heading text-[20px] text-neon-lime -skew-x-3 leading-none">ДВЖ</span>
            <p className="text-[9px] text-sidebar-foreground/30 tracking-[0.18em] uppercase font-semibold mt-0.5">
              реальные действия
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]));
          return (
            <Link key={href} href={href} className="relative block cursor-pointer group">
              {active && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl bg-sidebar-accent"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(200,255,87,0.1)" }}
                  transition={{ type: "spring", stiffness: 440, damping: 32 }}
                />
              )}
              <span className={cn(
                "relative flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-colors duration-150",
                active ? "text-lime" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/85 group-hover:bg-white/[0.025]",
              )}>
                <Icon className="h-[16px] w-[16px] shrink-0" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 pt-2 border-t border-sidebar-border space-y-0.5">
        {user ? (
          <>
            <CreateMenuButton user={user} />
            <Link
              href="/notifications"
              className="relative flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold text-sidebar-foreground/50 hover:text-sidebar-foreground/85 hover:bg-white/[0.025] rounded-xl transition-colors cursor-pointer"
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
                    : "text-sidebar-foreground/50 hover:text-heat hover:bg-heat/10",
                )}
              >
                <Shield className="h-[16px] w-[16px]" />
                Админ
              </Link>
            )}
          </>
        ) : (
          <Link href="/login" className="btn-action w-full justify-center py-2.5 text-xs gap-2">
            <Zap className="h-4 w-4" />
            Войти
          </Link>
        )}
      </div>
    </aside>
  );
}

export function MobileNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const tabs = buildNav(user?.username);

  function NavItem({ href, icon: Icon, label, exact = false }: {
    href: string; icon: ElementType; label: string; exact?: boolean;
  }) {
    const base = href.split("?")[0];
    const active = exact
      ? pathname === base
      : pathname === base || (base !== "/" && pathname.startsWith(base));
    return (
      <Link
        href={href}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer select-none",
          active ? "text-lime" : "text-sidebar-foreground/35",
        )}
      >
        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
        <span className="leading-none">{label}</span>
        {active && (
          <motion.span
            layoutId="mob-line"
            className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-lime"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    );
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="flex items-end border-t border-white/[0.07] bg-sidebar/95 backdrop-blur-2xl pb-safe">
        {tabs.map((tab) => (
          <NavItem key={tab.href} href={tab.href} icon={tab.icon} label={tab.label} exact={tab.exact} />
        ))}
      </div>
    </nav>
  );
}
