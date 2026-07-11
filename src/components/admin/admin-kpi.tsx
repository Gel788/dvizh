"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion-spring";
import { AdminCountUp } from "@/components/admin/admin-count-up";

export function AdminKpi({
  label,
  value,
  delta,
  deltaLabel,
  href,
  icon: Icon,
  accent = "lime",
  spark,
  delay = 0,
  size = "md",
}: {
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "lime" | "ice" | "heat" | "violet" | "gold";
  spark?: number[];
  delay?: number;
  size?: "md" | "lg";
}) {
  const reduced = useReducedMotion();
  const colors = {
    lime: "text-lime bg-lime/10 ring-lime/25 shadow-[0_0_24px_rgba(200,255,87,0.12)]",
    ice: "text-ice bg-ice/10 ring-ice/25 shadow-[0_0_24px_rgba(0,217,255,0.1)]",
    heat: "text-heat bg-heat/10 ring-heat/25 shadow-[0_0_24px_rgba(255,45,85,0.1)]",
    violet: "text-violet-400 bg-violet-500/10 ring-violet-500/25",
    gold: "text-amber-400 bg-amber-500/10 ring-amber-500/25",
  }[accent];

  const trend = delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const body = (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay }}
      whileHover={reduced || !href ? undefined : { y: -4, scale: 1.01, transition: spring.snappy }}
      className={cn(
        "admin-glass admin-kpi-shimmer group relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300",
        href && "cursor-pointer hover:border-lime/25 hover:shadow-[0_0_32px_rgba(200,255,87,0.08)]",
        size === "lg" && "sm:p-6",
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-lime/8 blur-2xl transition-opacity group-hover:opacity-100 opacity-40" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <div className="mt-2">
            <AdminCountUp
              value={value}
              className="admin-kpi-value font-heading text-3xl sm:text-4xl leading-none block"
            />
          </div>
          {(deltaLabel || delta != null) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {trend && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  trend === "up" && "bg-good/15 text-good",
                  trend === "down" && "bg-heat/15 text-heat",
                  trend === "flat" && "bg-white/5",
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {delta != null && delta > 0 ? `+${delta}` : delta}
                </span>
              )}
              {deltaLabel && <span>{deltaLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", colors)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      {spark && spark.length > 1 && (
        <svg className="mt-4 h-8 w-full opacity-80" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(200,255,87,0.4)" />
              <stop offset="100%" stopColor="rgba(200,255,87,0)" />
            </linearGradient>
          </defs>
          {(() => {
            const max = Math.max(...spark, 1);
            const pts = spark.map((v, i) => {
              const x = (i / (spark.length - 1)) * 120;
              const y = 32 - (v / max) * 28 - 2;
              return `${x},${y}`;
            });
            const line = pts.join(" ");
            const area = `0,32 ${line} 120,32`;
            return (
              <>
                <motion.polygon
                  fill={`url(#spark-${label})`}
                  points={area}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: delay + 0.2 }}
                />
                <motion.polyline
                  fill="none"
                  stroke="rgba(200,255,87,0.9)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={line}
                  initial={reduced ? false : { pathLength: 0, opacity: 0.4 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.9, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] }}
                />
              </>
            );
          })()}
        </svg>
      )}

      {href && (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-lime transition-colors">
          Открыть <ArrowUpRight className="h-3 w-3" />
        </span>
      )}
    </motion.div>
  );

  if (href) return <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40 rounded-2xl">{body}</Link>;
  return body;
}
