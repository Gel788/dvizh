"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell, CalendarDays, Home, MapPin, Medal, Megaphone,
  Plus, Target, Users, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import type { ElementType } from "react";

const nav = [
  { href: "/",              label: "Лента",       icon: Home },
  { href: "/map",           label: "Карта",        icon: MapPin },
  { href: "/challenges",    label: "Челленджи",    icon: Target },
  { href: "/announcements", label: "Объявления",   icon: Megaphone },
  { href: "/clubs",         label: "Клубы",        icon: Users },
  { href: "/events",        label: "Ивенты",       icon: CalendarDays },
  { href: "/leaderboard",   label: "Рейтинг",      icon: Medal },
];

export function Sidebar({
  user,
  unreadCount = 0,
}: {
  user: SessionUser | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/" className="group flex items-center gap-3 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime shrink-0">
            <span className="font-heading text-[20px] text-lime-foreground leading-none -skew-x-6">Д</span>
          </div>
          <div>
            <span className="font-heading text-[20px] text-neon-lime -skew-x-3 leading-none">ДВИЖ</span>
            <p className="text-[9px] text-sidebar-foreground/30 tracking-[0.18em] uppercase font-semibold mt-0.5">
              город · движение
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
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
                active
                  ? "text-lime"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/85 group-hover:bg-white/[0.025]",
              )}>
                <Icon className="h-[16px] w-[16px] shrink-0" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-2 border-t border-sidebar-border space-y-0.5">
        {user ? (
          <>
            <Link
              href="/create"
              className="btn-action w-full justify-center py-2.5 text-xs gap-2 mb-2"
            >
              <Plus className="h-4 w-4" />
              Запостить
            </Link>
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
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.025] transition-colors cursor-pointer"
            >
              <div className="h-6 w-6 rounded-full bg-lime flex items-center justify-center text-[10px] font-bold text-lime-foreground shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-sidebar-foreground/80 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-sidebar-foreground/35 truncate">@{user.username}</p>
              </div>
            </Link>
          </>
        ) : (
          <Link href="/login" className="btn-action w-full justify-center py-2.5 text-xs gap-2">
            <Zap className="h-4 w-4" />
            Врывайся
          </Link>
        )}
      </div>
    </aside>
  );
}

/* ── Mobile bottom bar: только быстрые действия ── */
export function MobileNav({
  user,
  unreadCount = 0,
}: {
  user: SessionUser | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const profileHref = user ? `/profile/${user.username}` : "/login";

  function NavItem({ href, icon: Icon, label, badge = 0, exact = false }: {
    href: string; icon: ElementType; label: string; badge?: number; exact?: boolean;
  }) {
    const active = exact ? pathname === href : pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[8.5px] font-bold uppercase tracking-[0.1em] transition-colors cursor-pointer select-none",
          active ? "text-lime" : "text-sidebar-foreground/35",
        )}
      >
        <div className="relative">
          <Icon className="h-[22px] w-[22px]" />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-heat text-[7px] font-bold text-white px-0.5 leading-none">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
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
      <div className="flex items-end border-t border-white/[0.07] bg-sidebar/95 backdrop-blur-2xl">
        <NavItem href="/"           icon={Home}   label="Лента"     exact />
        <NavItem href="/challenges" icon={Target} label="Челл." />

        {/* FAB */}
        <div className="flex flex-1 flex-col items-center pb-1.5 -mt-4">
          <motion.div whileTap={{ scale: 0.87 }} transition={{ type: "spring", stiffness: 520, damping: 28 }}>
            <Link
              href="/create"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-lime-foreground shadow-[0_-2px_28px_rgba(200,255,87,0.4),0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <Plus className="h-7 w-7" />
            </Link>
          </motion.div>
          <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-lime/50 leading-none">Пост</span>
        </div>

        <NavItem href="/events"   icon={CalendarDays} label="Ивенты" />
        <NavItem href={profileHref} icon={Users}      label="Профиль" />
      </div>
      {/* safe area */}
      <div className="bg-sidebar/95 h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
}
