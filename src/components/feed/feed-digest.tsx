"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion-spring";

type ScopeKey = "city" | "district" | "friends";

type DigestScope = {
  label: string;
  headline: string;
  body: string;
  stats: { value: string; label: string }[];
};

type Props = {
  city: string;
  scopes: Record<ScopeKey, DigestScope>;
};

const TABS: { id: ScopeKey; label: string }[] = [
  { id: "city", label: "Город" },
  { id: "district", label: "Район" },
  { id: "friends", label: "Друзья" },
];

export function FeedDigest({ city, scopes }: Props) {
  const [scope, setScope] = useState<ScopeKey>("city");
  const active = scopes[scope];
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[scope];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [scope]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className="relative overflow-hidden rounded-[28px] p-5 lg:p-6 text-white border border-lime/20 h-full"
      style={{ background: "linear-gradient(135deg, #1a1528 0%, #2d2248 55%, #1a2838 100%)" }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime/[0.12] blur-2xl" />
      <div className="relative z-10 lg:flex lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="t-tabs mb-4 w-fit">
            <span
              className="t-tabs__indicator"
              style={{ left: indicator.left, width: indicator.width }}
              aria-hidden
            />
            {TABS.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                type="button"
                onClick={() => setScope(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer",
                  scope === tab.id ? "text-lime-foreground" : "text-white/70 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={scope}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-lime/80 mb-1">
                Дайджест недели · {scope === "city" ? city : active.label}
              </p>
              <h2 className="font-heading text-xl lg:text-2xl xl:text-3xl font-bold leading-tight max-w-[280px] lg:max-w-md xl:max-w-lg">
                {active.headline}
              </h2>
              <p className="text-sm text-white/80 mt-2 leading-relaxed max-w-[290px] lg:max-w-md">
                {active.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-5 mt-4 lg:mt-0 lg:gap-6 shrink-0">
          <AnimatePresence mode="wait">
            {active.stats.map((s, i) => (
              <motion.div
                key={`${scope}-${s.label}`}
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ ...spring.bouncy, delay: i * 0.06 }}
                className="lg:text-right"
              >
                <p className="font-heading text-2xl lg:text-3xl font-bold text-lime leading-none t-number-pop">
                  {s.value}
                </p>
                <p className="text-[11px] text-white/75 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
