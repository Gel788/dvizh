"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Building2,
  Calendar,
  CalendarDays,
  Flag,
  Film,
  Gift,
  LayoutDashboard,
  Search,
  Settings2,
  Sparkles,
  Trophy,
  Users,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { adminNav } from "@/components/admin/admin-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const extras = [
  { href: "/", label: "Открыть приложение", icon: Zap },
  { href: "/admin/system", label: "Рассылка уведомлений", icon: Activity },
] as const;

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin": LayoutDashboard,
  "/admin/users": Users,
  "/admin/posts": Activity,
  "/admin/feed": Sparkles,
  "/admin/challenges": Trophy,
  "/admin/events": Calendar,
  "/admin/social": Flag,
  "/admin/wishlists": Gift,
  "/admin/media": Film,
  "/admin/calendar": CalendarDays,
  "/admin/reports": AlertTriangle,
  "/admin/clubs": Building2,
  "/admin/achievements": Award,
  "/admin/system": Settings2,
};

type PaletteItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
};

export function AdminCommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const items = useMemo<PaletteItem[]>(
    () => [
      ...adminNav.map((item) => ({
        href: item.href,
        label: item.label,
        icon: icons[item.href] ?? LayoutDashboard,
        group: "Разделы",
      })),
      ...extras.map((item) => ({
        href: item.href,
        label: item.label,
        icon: item.icon,
        group: "Действия",
      })),
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    );
  }, [items, query]);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      run(filtered[activeIndex].href);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  let flatIndex = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Поиск разделов</span>
        <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden border-white/10 bg-popover p-0 sm:max-w-md">
          <DialogHeader className="border-b border-white/[0.06] px-4 py-3">
            <DialogTitle className="text-sm">Админ-палитра</DialogTitle>
            <DialogDescription className="sr-only">Быстрый переход по разделам</DialogDescription>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Куда перейти…"
                className="border-white/10 bg-white/[0.03] pl-9"
              />
            </div>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Ничего не найдено</p>
            ) : (
              groups.map(([group, groupItems]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  <ul>
                    {groupItems.map((item) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const Icon = item.icon;
                      const active = idx === activeIndex;
                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            onClick={() => run(item.href)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                              active ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:bg-white/[0.04]",
                            )}
                          >
                            <Icon className="h-4 w-4 text-lime" />
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/[0.06] px-3 py-2 text-[10px] text-muted-foreground">
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono">⌘R</kbd> обновить дашборд
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
