"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

/** CreateHub parity with Flutter v38 — 6 типов */
export const CREATE_ITEMS: { emoji: string; label: string; href: (u: string) => string }[] = [
  { emoji: "✅", label: "Дело", href: () => `/today?openTask=1` },
  { emoji: "📅", label: "Событие", href: () => `/today?view=calendar&openEvent=1` },
  { emoji: "🏆", label: "Челлендж", href: () => `/create?type=challenge` },
  { emoji: "⚔️", label: "Спор", href: () => `/friends?view=duels&create=1` },
  { emoji: "🤝", label: "Вместе", href: () => `/friends?view=together&create=1` },
  { emoji: "🎁", label: "Вишлист", href: (u) => `/wishlist?create=1` },
];

export function CreateMenuModal({
  open,
  onClose,
  username,
}: {
  open: boolean;
  onClose: () => void;
  username?: string;
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-md rounded-t-[28px] lg:rounded-[28px] bg-popover border border-border p-5 pb-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl text-foreground">Что создать?</h3>
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted/60 cursor-pointer" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CREATE_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href(username ?? "")}
                  onClick={onClose}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4",
                    "hover:border-lime/50 hover:bg-accent transition-colors cursor-pointer",
                  )}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function CreateMenuButton({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-action w-full justify-center py-2.5 text-xs gap-2 mb-2 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Создать
      </button>
      <CreateMenuModal open={open} onClose={() => setOpen(false)} username={user.username} />
    </>
  );
}

/** FAB теперь в V38BottomNav */
export function MobileCreateFab() {
  return null;
}
