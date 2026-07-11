"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { LevelPill } from "@/components/layout/v38/level-pill";
import { SearchBar } from "./search-bar";

export function TopBar({ user, unreadCount = 0 }: { user: SessionUser | null; unreadCount?: number }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-background/92 backdrop-blur-xl border-b border-border">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="lg:hidden flex items-center gap-2 cursor-pointer shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime">
            <span className="font-heading text-lg text-lime-foreground leading-none -skew-x-6">Д</span>
          </div>
          <span className="font-heading text-lg text-foreground -skew-x-3">ДВЖ</span>
        </Link>

        <div className="hidden lg:block flex-1 max-w-md">
          <SearchBar />
        </div>

        <Link
          href="/search"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          aria-label="Поиск"
        >
          <Search className="h-[18px] w-[18px]" />
        </Link>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {user ? (
            <>
              <LevelPill xp={user.reputation} username={user.username} className="hidden sm:inline-flex" />
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
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
                  <Avatar className="h-9 w-9 ring-1 ring-border hover:ring-lime/40 transition-all duration-200">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-lime text-lime-foreground font-bold text-xs">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-border bg-popover shadow-lg">
                  <div className="px-3 py-2.5">
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>Профиль</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>Настройки</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-heat focus:text-heat" onClick={() => logoutAction()}>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-muted/50">
                Войти
              </Link>
              <Link href="/register" className="btn-action py-2 px-3.5 text-xs">
                Начать
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
