"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";

type PulseMetric = { icon: string; value: string; label: string };

export function PulseDayCard({
  metrics,
  city,
}: {
  metrics: PulseMetric[];
  city: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[22px] border border-lime/12 p-4"
      style={{
        background: "linear-gradient(145deg, rgba(200,255,87,0.14) 0%, rgba(17,17,22,0.98) 42%, rgba(8,8,13,1) 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-lime/15 text-lime px-2 py-0.5 rounded-full border border-lime/20">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
              live
            </span>
          </div>
          <h2 className="font-heading text-xl leading-tight text-foreground">Пульс дня</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{city} · друзья, район и город</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.slice(0, 4).map((m) => (
          <div
            key={m.label}
            className="rounded-2xl bg-card/80 backdrop-blur-sm px-3 py-3 border border-white/[0.08]"
          >
            <p className="text-lg font-heading leading-none text-foreground">
              {m.icon} {m.value}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 leading-snug">{m.label}</p>
          </div>
        ))}
      </div>
      <Link
        href="/pulse"
        className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 text-xs font-bold text-foreground hover:border-lime/20 transition-colors"
      >
        <span>Вечером район оживает · 18:00–21:00</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </motion.div>
  );
}
