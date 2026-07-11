"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, useReducedMotion } from "motion/react";
import type { AdminDashboardData } from "@/lib/admin/stats";
import { cn } from "@/lib/utils";
import { stagger } from "@/lib/motion-spring";

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  TASK_COMPLETED: { emoji: "✅", color: "bg-lime/15 text-lime" },
  CHALLENGE_JOIN: { emoji: "🏆", color: "bg-heat/15 text-heat" },
  POST_CREATED: { emoji: "📝", color: "bg-ice/15 text-ice" },
  ACHIEVEMENT: { emoji: "⭐", color: "bg-amber-500/15 text-amber-400" },
  DEFAULT: { emoji: "⚡", color: "bg-white/10 text-muted-foreground" },
};

export function AdminActivityStream({
  activities,
  limit = 12,
}: {
  activities: AdminDashboardData["recentActivities"];
  limit?: number;
}) {
  const reduced = useReducedMotion();
  const list = activities.slice(0, limit);

  return (
    <div className="admin-glass rounded-2xl overflow-hidden relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />
      <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Live feed</p>
          <h3 className="font-heading text-lg mt-0.5">Активность платформы</h3>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-good">
          <span className="admin-pulse-dot h-2 w-2 rounded-full bg-good" />
          Realtime
        </span>
      </div>

      <ul className="divide-y divide-white/[0.04] max-h-[420px] overflow-y-auto">
        {list.length === 0 ? (
          <li className="p-10 text-center text-sm text-muted-foreground">Тишина — ждём первых действий</li>
        ) : (
          list.map((a, i) => {
            const meta = TYPE_META[a.type] ?? TYPE_META.DEFAULT;
            return (
              <motion.li
                key={a.id}
                initial={reduced ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * stagger.fast, type: "spring", stiffness: 380, damping: 28 }}
                className="group px-5 py-3.5 hover:bg-lime/[0.03] transition-colors"
              >
                <div className="flex gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base", meta.color)}>
                    {meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{a.title}</p>
                    {a.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{a.body}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      <Link href={`/profile/${a.user.username}`} className="font-semibold hover:text-lime transition-colors">
                        {a.user.name}
                      </Link>
                      <span className="mx-1.5 opacity-40">·</span>
                      <span className="font-mono text-[10px] uppercase opacity-70">{a.type.replace(/_/g, " ")}</span>
                      <span className="mx-1.5 opacity-40">·</span>
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })
        )}
      </ul>
    </div>
  );
}
