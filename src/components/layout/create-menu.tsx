"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const ITEMS: { emoji: string; label: string; href: (u: string) => string }[] = [
  { emoji: "✅", label: "Дело", href: (u) => `/profile/${u}?tab=diary&openTask=1` },
  { emoji: "📅", label: "Событие", href: (u) => `/profile/${u}?tab=diary&view=calendar&openEvent=1` },
  { emoji: "⚔️", label: "Спор", href: () => `/friends?view=duels&create=1` },
  { emoji: "🤝", label: "Вместе", href: () => `/friends?view=together&create=1` },
  { emoji: "🎬", label: "Медиалист", href: (u) => `/profile/${u}?tab=media&create=1` },
  { emoji: "🎁", label: "Вишлист", href: (u) => `/profile/${u}?tab=wishlists&create=1` },
];

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
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm lg:items-center"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-t-[28px] lg:rounded-[28px] bg-popover border border-white/[0.08] p-5 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl">Что создать?</h3>
                <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/5 cursor-pointer" aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href(user.username)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4",
                      "hover:border-lime/40 hover:bg-lime/5 transition-colors cursor-pointer",
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
    </>
  );
}

export function MobileCreateFab({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 h-14 w-14 rounded-full bg-lime text-lime-foreground shadow-lg flex items-center justify-center cursor-pointer"
        aria-label="Создать"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full rounded-t-[28px] bg-popover border-t border-white/[0.08] p-5 pb-10"
            >
              <div className="w-10 h-1 rounded-full bg-white/[0.12] mx-auto mb-4" />
              <h3 className="font-heading text-xl mb-4">Что создать?</h3>
              <div className="grid grid-cols-3 gap-3">
                {ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href(user.username)}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 cursor-pointer"
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
    </>
  );
}
