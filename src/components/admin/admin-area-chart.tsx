"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion-spring";
import { AdminCountUp } from "@/components/admin/admin-count-up";

type Series = {
  key: string;
  label: string;
  data: { label: string; count: number }[];
  accent: string;
  glow: string;
};

export function AdminAreaChart({
  series,
  defaultKey,
}: {
  series: Series[];
  defaultKey?: string;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(defaultKey ?? series[0]?.key ?? "");
  const [hover, setHover] = useState<number | null>(null);

  const current = series.find((s) => s.key === active) ?? series[0];
  if (!current) return null;

  const data = current.data;
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const lastIdx = data.length - 1;

  const w = 400;
  const h = 140;
  const pad = 4;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (d.count / max) * (h - pad * 2);
    return { x, y, ...d };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;

  return (
    <div className="admin-glass rounded-2xl p-5 sm:p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-40" style={{ background: current.accent }} />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5 relative z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Тренды</p>
          <h3 className="font-heading text-xl mt-1">7-дневная динамика</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {current.label} · всего{" "}
            <AdminCountUp value={total} className="text-lime font-bold inline" duration={0.8} />
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all",
                active === s.key
                  ? "bg-[#10130f] text-lime shadow-[0_0_16px_rgba(200,255,87,0.25)] scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[140px] sm:h-[180px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`area-${current.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={current.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={current.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* baseline grid */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={pad}
              x2={w - pad}
              y1={h - pad - pct * (h - pad * 2)}
              y2={h - pad - pct * (h - pad * 2)}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          <motion.polygon
            key={`area-${current.key}`}
            fill={`url(#area-${current.key})`}
            points={area}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.polyline
            key={`line-${current.key}`}
            fill="none"
            stroke={current.accent}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={line}
            initial={reduced ? false : { pathLength: 0, opacity: 0.5 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: current.glow }}
          />
          {points.map((p, i) => (
            <motion.circle
              key={`${current.key}-${i}`}
              cx={p.x}
              cy={p.y}
              r={hover === i ? 6 : i === lastIdx ? 4 : 3}
              fill={current.accent}
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                ...(i === lastIdx && !reduced
                  ? { r: [4, 5.5, 4] }
                  : {}),
              }}
              transition={
                i === lastIdx && !reduced
                  ? {
                      scale: spring.gentle,
                      opacity: { ...spring.gentle, delay: 0.8 + i * 0.04 },
                      r: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    }
                  : { ...spring.gentle, delay: 0.8 + i * 0.04 }
              }
              style={{ filter: hover === i || i === lastIdx ? current.glow : undefined }}
            />
          ))}
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex justify-between px-1">
          {data.map((d, i) => (
            <button
              key={d.label + i}
              type="button"
              className="flex-1 text-center py-2 cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              aria-label={`${d.label}: ${d.count}`}
            >
              <span className={cn(
                "text-[10px] font-bold uppercase transition-colors",
                hover === i ? "text-foreground" : "text-muted-foreground",
              )}>
                {d.label}
              </span>
              {hover === i && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block text-xs font-bold tabular-nums mt-0.5"
                  style={{ color: current.accent }}
                >
                  {d.count}
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
