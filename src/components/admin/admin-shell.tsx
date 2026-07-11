"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Shield,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import type { AdminNavBadges } from "@/lib/admin/stats";
import { adminNav, adminNavLabel, adminNavSections } from "@/components/admin/admin-nav";
import { AdminCommandMenu } from "@/components/admin/admin-command-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function navBadge(href: string, badges: AdminNavBadges): number | null {
  if (href === "/admin/reports" && badges.reports > 0) return badges.reports;
  if (href === "/admin/social" && badges.pendingJoins + badges.pendingFriends > 0) {
    return badges.pendingJoins + badges.pendingFriends;
  }
  if (href === "/admin/posts" && badges.hiddenPosts > 0) return badges.hiddenPosts;
  return null;
}

function NavLinks({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string;
  badges: AdminNavBadges;
  onNavigate?: () => void;
}) {
  return (
    <>
      {adminNavSections.map((section) => (
        <div key={section.key} className="mb-5 last:mb-0">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {adminNav
              .filter((item) => item.section === section.key)
              .map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                const badge = navBadge(href, badges);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                      active
                        ? "bg-lime/[0.1] text-lime shadow-[inset_0_0_0_1px_rgba(200,255,87,0.12)]"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="admin-nav-indicator"
                        className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-lime shadow-[0_0_8px_rgba(200,255,87,0.6)]"
                      />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-lime" : "opacity-70 group-hover:opacity-100")} />
                    <span className="truncate flex-1">{label}</span>
                    {badge != null && (
                      <span className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                        href === "/admin/reports" ? "bg-heat text-white" : "bg-lime/20 text-lime",
                      )}>
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                    {active && <ChevronRight className="h-3.5 w-3.5 opacity-40" />}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </>
  );
}

function LiveClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="hidden font-mono text-[11px] text-muted-foreground tabular-nums lg:inline">{now}</span>;
}

export function AdminShell({
  user,
  badges,
  children,
}: {
  user: SessionUser;
  badges: AdminNavBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pageTitle = adminNavLabel(pathname);
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="admin-shell admin-mesh min-h-screen text-foreground flex">
      <aside className="admin-sidebar hidden lg:flex w-[280px] shrink-0 flex-col fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/10 ring-1 ring-lime/30 transition-shadow group-hover:shadow-[0_0_24px_rgba(200,255,87,0.25)]">
              <Shield className="h-5 w-5 text-lime" />
              {badges.total > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-heat px-1 text-[9px] font-bold text-white">
                  {badges.total > 9 ? "9+" : badges.total}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xl leading-none text-lime tracking-wide">COMMAND</p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                ДВЖ · ops console
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
          <NavLinks pathname={pathname} badges={badges} />
        </nav>

        <div className="border-t border-white/[0.06] p-3 space-y-2">
          <div className="admin-glass flex items-center gap-3 rounded-xl px-3 py-2.5">
            <Avatar className="h-9 w-9 border border-lime/25">
              <AvatarFallback className="bg-lime/10 text-xs font-bold text-lime">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-white/[0.04] hover:text-lime transition-colors">
            <Zap className="h-4 w-4" />
            В приложение
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-heat/10 hover:text-heat transition-colors">
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[280px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#060608]/80 backdrop-blur-2xl">
          <div className="flex h-[60px] items-center justify-between gap-3 px-4 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] lg:hidden cursor-pointer">
                  <Menu className="h-4 w-4" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] border-white/10 bg-[#0a0a10] p-0">
                  <SheetHeader className="border-b border-white/[0.06] px-5 py-4 text-left">
                    <SheetTitle className="font-heading text-xl text-lime">COMMAND</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto p-2 pb-6">
                    <NavLinks pathname={pathname} badges={badges} onNavigate={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Console</p>
                <p className="truncate font-heading text-xl leading-tight">{pageTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LiveClock />
              <AdminCommandMenu />
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime/10 px-2.5 py-1 text-[10px] font-bold uppercase text-lime">
                <Search className="h-3 w-3" />
                ⌘K
              </span>
              {badges.total > 0 && (
                <span className="rounded-full bg-heat/15 px-2 py-0.5 text-[10px] font-bold text-heat ring-1 ring-heat/30">
                  {badges.total} alert{badges.total === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="admin-main flex-1 relative">{children}</main>
      </div>
    </div>
  );
}
