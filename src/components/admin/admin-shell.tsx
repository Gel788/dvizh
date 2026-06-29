"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  LogOut,
  Menu,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { adminNav, adminNavLabel, adminNavSections } from "@/components/admin/admin-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {adminNavSections.map((section) => (
        <div key={section.key} className="mb-4 last:mb-0">
          <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {adminNav
              .filter((item) => item.section === section.key)
              .map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-lime/[0.08] text-lime"
                        : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-lime" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-lime" : "opacity-70")} />
                    <span className="truncate">{label}</span>
                    {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pageTitle = adminNavLabel(pathname);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-shell min-h-screen bg-background text-foreground flex">
      <aside className="admin-sidebar hidden lg:flex w-[268px] shrink-0 flex-col border-r border-white/[0.06] bg-sidebar fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10 ring-1 ring-lime/25">
              <Shield className="h-5 w-5 text-lime" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-lg leading-none text-lime">АДМИН</p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ДВИЖ · control
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="border-t border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.05]">
            <Avatar className="h-9 w-9 border border-lime/20">
              <AvatarFallback className="bg-lime/10 text-xs font-bold text-lime">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
          >
            <Zap className="h-4 w-4" />
            В приложение
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-heat/10 hover:text-heat"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[268px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/85 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground lg:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Меню</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] border-white/10 bg-sidebar p-0">
                  <SheetHeader className="border-b border-white/[0.06] px-5 py-4 text-left">
                    <SheetTitle className="font-heading text-xl text-lime">АДМИН</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto p-2 pb-6">
                    <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Консоль</p>
                <p className="truncate font-heading text-lg leading-tight">{pageTitle}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="chip chip-lime text-[10px]">ADMIN</span>
              <span className="hidden h-5 w-px bg-white/10 sm:block" />
              <span className="max-w-[180px] truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </header>

        <main className="admin-main flex-1 dvizh-grid">{children}</main>
      </div>
    </div>
  );
}
