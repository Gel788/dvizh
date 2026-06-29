"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { spring } from "@/lib/motion-spring";
import { cn } from "@/lib/utils";

export type FunnelStage = {
  label: string;
  value: number;
  color?: string;
};

const PALETTE = ["#C8FF57", "#9AFF00", "#06B6A4", "#7C5CFF", "#FF2D55"];

type Props = {
  stages: FunnelStage[];
  className?: string;
  title?: string;
  subtitle?: string;
};

/** Bklit-inspired animated funnel — motion.dev halos + stagger */
export function EngagementFunnel({ stages, className, title, subtitle }: Props) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  const normalized = useMemo(
    () => stages.map((s, i) => ({
      ...s,
      pct: s.value / max,
      color: s.color ?? PALETTE[i % PALETTE.length],
    })),
    [stages, max],
  );

  return (
    <div className={cn("web-panel p-4 overflow-hidden", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {normalized.map((stage, i) => {
          const widthPct = 28 + stage.pct * 72;
          return (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.default, delay: i * 0.08 }}
              className="relative"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground/90 truncate">
                  {stage.label}
                </span>
                <span className="t-number-pop text-sm font-heading text-lime tabular-nums" style={{ animationDelay: `${i * 80}ms` }}>
                  {stage.value.toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="relative h-9 flex items-center">
                {/* halo rings */}
                {[0.12, 0.06].map((op, ring) => (
                  <motion.div
                    key={ring}
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-xl"
                    style={{
                      width: `${widthPct + ring * 8}%`,
                      height: `${100 - ring * 20}%`,
                      background: stage.color,
                      opacity: op,
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: op }}
                    transition={{ ...spring.gentle, delay: i * 0.08 + ring * 0.04 }}
                  />
                ))}
                <motion.div
                  className="relative h-full rounded-xl border border-white/[0.08] overflow-hidden"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${stage.color}22, ${stage.color}44)`,
                  }}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ ...spring.default, delay: i * 0.08 }}
                  whileHover={{ scale: 1.02, transition: spring.snappy }}
                >
                  <div
                    className="absolute inset-0 opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${stage.color}55)` }}
                  />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
