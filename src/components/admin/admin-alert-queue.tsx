"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, EyeOff, MapPin, UserPlus } from "lucide-react";
import type { AdminDashboardData } from "@/lib/admin/stats";
import { cn } from "@/lib/utils";
import { stagger } from "@/lib/motion-spring";

type AlertItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  severity: "critical" | "warn" | "info";
  icon: React.ComponentType<{ className?: string }>;
};

export function AdminAlertQueue({ data }: { data: AdminDashboardData }) {
  const items: AlertItem[] = [
    {
      id: "reports",
      label: "Жалобы на контент",
      count: data.contentReportsTotal,
      href: "/admin/reports",
      severity: (data.contentReportsTotal > 0 ? "critical" : "info") as AlertItem["severity"],
      icon: AlertTriangle,
    },
    {
      id: "joins",
      label: "Move — заявки на join",
      count: data.pendingJoinRequests,
      href: "/admin/social",
      severity: (data.pendingJoinRequests > 0 ? "warn" : "info") as AlertItem["severity"],
      icon: MapPin,
    },
    {
      id: "friends",
      label: "Заявки в друзья",
      count: data.pendingFriendships,
      href: "/admin/social",
      severity: (data.pendingFriendships > 0 ? "warn" : "info") as AlertItem["severity"],
      icon: UserPlus,
    },
    {
      id: "hidden",
      label: "Скрытые посты",
      count: data.hiddenPosts,
      href: "/admin/posts",
      severity: (data.hiddenPosts > 5 ? "warn" : "info") as AlertItem["severity"],
      icon: EyeOff,
    },
  ].filter((i) => i.count > 0 || i.id === "reports");

  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="admin-glass-accent rounded-2xl p-5 relative overflow-hidden admin-scanline">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime/80">Очередь модерации</p>
          <p className="mt-1 font-heading text-2xl tabular-nums">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">элементов требуют внимания</p>
        </div>
        <span className="rounded-full bg-heat/15 px-2.5 py-1 text-[10px] font-bold uppercase text-heat ring-1 ring-heat/25">
          Live
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * stagger.normal }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]",
                  item.severity === "critical" && "ring-1 ring-heat/20 bg-heat/[0.04]",
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  item.severity === "critical" ? "text-heat" : item.severity === "warn" ? "text-amber-400" : "text-muted-foreground",
                )} />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <span className="font-heading text-lg tabular-nums text-lime">{item.count}</span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
