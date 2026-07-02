"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Zap, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { SearchBar } from "./search-bar";

export function TopBar({ user, unreadCount = 0 }: { user: SessionUser | null; unreadCount?: number }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="lg:hidden flex items-center gap-2 cursor-pointer shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime">
            <span className="font-heading text-lg text-lime-foreground leading-none -skew-x-6">Д</span>
          </div>
          <span className="font-heading text-lg text-neon-lime -skew-x-3">ДВЖ</span>
        </Link>

        <SearchBar />

        {user?.city && (
          <Link
            href={`/?city=${encodeURIComponent(user.city)}`}
            className="hidden lg:inline-flex chip chip-lime text-[10px] shrink-0 hover:bg-lime/15 cursor-pointer"
          >
            <MapPin className="h-3 w-3" />
            {user.city}
          </Link>
        )}

        <div className="hidden lg:flex flex-1" />

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {user ? (
            <>
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-lime text-lime-foreground text-xs font-bold uppercase tracking-wider hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(200,255,87,0.3)] transition-all duration-200 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Записать
              </Link>
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-heat px-0.5 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-none cursor-pointer">
                  <Avatar className="h-9 w-9 ring-1 ring-white/[0.08] hover:ring-lime/35 transition-all duration-200">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-lime text-lime-foreground font-bold text-xs">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-white/[0.09] bg-popover shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                  <div className="px-3 py-2.5">
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>Профиль</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>Настройки</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem className="cursor-pointer text-heat focus:text-heat" onClick={() => logoutAction()}>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/[0.04]">
                Войти
              </Link>
              <Link href="/register" className="btn-action py-2 px-3.5 text-xs">
                <Zap className="h-3.5 w-3.5" />
                Начать
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
