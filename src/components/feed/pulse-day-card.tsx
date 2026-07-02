"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { RefPulseMetricTile } from "@/components/surface/ref-ui";

type PulseMetric = { icon: string; value: string; label: string };

export function PulseDayCard({
  metrics,
}: {
  metrics: PulseMetric[];
  city?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[27px] border border-[#d8ecc0] p-[15px] mt-3.5"
      style={{
        background: "linear-gradient(135deg, #fffef8 0%, #f2ffe3 52%, #fff4ca 100%)",
        boxShadow: "0 18px 36px rgba(116, 148, 48, 0.14)",
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-extrabold leading-[1.08] text-[var(--ref-ink)]">Пульс дня</h2>
          <p className="text-[12px] font-semibold ref-muted mt-1">друзья, район и город сегодня</p>
        </div>
        <div className="ref-card inline-flex items-center gap-1.5 rounded-full px-2 py-[5px]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--ref-success)] animate-pulse" />
          <span className="text-[10.5px] font-bold ref-muted">live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.slice(0, 4).map((m) => (
          <RefPulseMetricTile key={m.label} emoji={m.icon} value={m.value} label={m.label} />
        ))}
      </div>

      <Link
        href="/pulse"
        className="ref-card mt-2.5 flex items-center gap-2 rounded-[18px] border-[#e7d9ca] px-[11px] py-2.5"
      >
        <span className="text-base" aria-hidden>🌆</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-bold text-[var(--ref-ink)]">Вечером район оживает</p>
          <p className="text-[10.5px] font-bold ref-muted mt-0.5">больше всего движухи обычно с 18:00 до 21:00</p>
        </div>
        <span className="text-[20px] text-[#bab0a7]" aria-hidden>›</span>
      </Link>
    </motion.div>
  );
}
