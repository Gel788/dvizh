"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AdminDashboardData } from "@/lib/admin/stats";

function TickerItem({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 px-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className={`font-heading text-sm tabular-nums ${accent ?? "text-lime"}`}>{value}</span>
      <span className="h-1 w-1 rounded-full bg-white/20" />
    </span>
  );
}

export function AdminLiveTicker({ data }: { data: AdminDashboardData }) {
  const reduced = useReducedMotion();
  const alerts = data.contentReportsTotal + data.pendingJoinRequests + data.pendingFriendships;

  const items = [
    { label: "Users", value: data.usersTotal, accent: "text-lime" },
    { label: "24h", value: `+${data.usersToday}`, accent: "text-good" },
    { label: "Posts", value: data.postsTotal, accent: "text-ice" },
    { label: "Tasks today", value: data.tasksCompletedToday, accent: "text-violet-400" },
    { label: "Alerts", value: alerts, accent: alerts > 0 ? "text-heat" : "text-muted-foreground" },
    { label: "Push", value: data.pushDevicesTotal, accent: "text-amber-400" },
    { label: "Wishlists", value: data.wishlistsTotal, accent: "text-amber-300" },
    { label: "Duels", value: data.duelsTotal, accent: "text-heat" },
  ];

  const row = (
    <>
      {items.map((item) => (
        <TickerItem key={item.label} label={item.label} value={item.value} accent={item.accent} />
      ))}
    </>
  );

  return (
    <div className="admin-ticker-wrap relative mb-6 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 py-2.5 ring-1 ring-white/[0.04]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#060608] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#060608] to-transparent" />
      {reduced ? (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4">{row}</div>
      ) : (
        <motion.div
          className="admin-ticker flex w-max items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        >
          {row}
          {row}
        </motion.div>
      )}
    </div>
  );
}
