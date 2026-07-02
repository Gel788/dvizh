"use client";

import Link from "next/link";
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
      className="relative overflow-hidden rounded-[22px] p-4 text-white"
      style={{ background: "linear-gradient(135deg, #1a1528 0%, #2d4a3e 55%, #1a2838 100%)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-white/15 px-2 py-0.5 rounded-full mb-2">
            сегодня
          </span>
          <h2 className="font-heading text-xl leading-tight">Пульс дня</h2>
          <p className="text-xs text-white/70 mt-1">{city} · друзья, район и город</p>
        </div>
        <span className="text-2xl" aria-hidden>💫</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.slice(0, 4).map((m) => (
          <div key={m.label} className="rounded-xl bg-white/10 px-3 py-2.5 border border-white/10">
            <p className="text-lg font-heading leading-none">
              {m.icon} {m.value}
            </p>
            <p className="text-[10px] text-white/65 font-semibold mt-1">{m.label}</p>
          </div>
        ))}
      </div>
      <Link
        href="/pulse"
        className="mt-3 inline-flex text-xs font-bold text-lime hover:underline cursor-pointer"
      >
        Подробнее →
      </Link>
    </motion.div>
  );
}
