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
      className="relative overflow-hidden rounded-[27px] border border-[#d8ecc0] p-4"
      style={{
        background: "linear-gradient(135deg, #fffef8 0%, #f2ffe3 52%, #fff4ca 100%)",
        boxShadow: "0 18px 36px rgba(116, 148, 48, 0.14)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-[var(--ref-ink,#33251f)]">
            Пульс дня
          </h2>
          <p className="text-xs font-semibold ref-muted mt-1">
            {city} · друзья, район и город сегодня
          </p>
        </div>
        <span className="ref-card inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-extrabold ref-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ref-green,#98c84a)] animate-pulse" />
          live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.slice(0, 4).map((m) => (
          <div
            key={m.label}
            className="ref-card rounded-[18px] px-3 py-2.5"
          >
            <p className="text-base font-extrabold leading-none text-[var(--ref-ink,#33251f)]">
              {m.icon} {m.value}
            </p>
            <p className="text-[10px] ref-muted font-bold mt-1.5 leading-snug">{m.label}</p>
          </div>
        ))}
      </div>
      <Link
        href="/pulse"
        className="ref-card mt-2.5 flex items-center gap-2 rounded-[18px] px-3 py-2.5 hover:opacity-95 transition-opacity"
      >
        <span className="text-base" aria-hidden>🌆</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[var(--ref-ink,#33251f)]">Вечером район оживает</p>
          <p className="text-[10px] font-bold ref-muted mt-0.5">больше всего движухи с 18:00 до 21:00</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#bab0a7]" />
      </Link>
    </motion.div>
  );
}
