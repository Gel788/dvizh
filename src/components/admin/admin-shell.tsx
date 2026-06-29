"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Award,
  Building2,
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings2,
  Shield,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

const nav = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/posts", label: "Посты", icon: Activity },
  { href: "/admin/challenges", label: "Челленджи", icon: Trophy },
  { href: "/admin/events", label: "События", icon: Calendar },
  { href: "/admin/clubs", label: "Клубы", icon: Building2 },
  { href: "/admin/achievements", label: "Достижения", icon: Award },
  { href: "/admin/system", label: "Система", icon: Settings2 },
];

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#06060A] text-foreground flex">
      <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#08080D] fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-heat/20 border border-heat/30">
              <Shield className="h-5 w-5 text-heat" />
            </div>
            <div>
              <p className="font-heading text-lg text-neon-lime leading-none">АДМИН</p>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.16em] mt-1">центр управления</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-white/[0.06] text-lime"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-white/45 hover:text-white/80 hover:bg-white/[0.03]"
          >
            <Zap className="h-4 w-4" />
            В приложение
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-white/45 hover:text-heat hover:bg-heat/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </form>
          <p className="px-3.5 pt-2 text-[11px] text-white/25 truncate">{user.email}</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 lg:pl-[240px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#06060A]/90 backdrop-blur-md px-4 py-3 lg:px-8 flex items-center justify-between gap-4">
          <div className="lg:hidden flex items-center gap-2">
            <Shield className="h-5 w-5 text-heat" />
            <span className="font-heading text-lg text-neon-lime">Админ</span>
          </div>
          <p className="hidden lg:block text-sm text-white/40">
            {user.name} · <span className="text-heat">ADMIN</span>
          </p>
          <div className="flex items-center gap-2 lg:hidden overflow-x-auto">
            {nav.slice(0, 4).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border",
                  pathname === href || (href !== "/admin" && pathname.startsWith(href))
                    ? "border-lime/30 text-lime bg-lime/10"
                    : "border-white/10 text-white/50",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
