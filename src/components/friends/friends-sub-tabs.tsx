"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion-spring";
import { Swords, Users, Zap } from "lucide-react";

const TABS = [
  { id: "feed", label: "Лента", icon: Users },
  { id: "duels", label: "Споры", icon: Swords },
  { id: "together", label: "Вместе", icon: Zap },
] as const;

export function FriendsSubTabs() {
  const params = useSearchParams();
  const view = params.get("view") ?? "feed";
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[view];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view]);

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none">
      <div className="t-tabs shrink-0">
        <span className="t-tabs__indicator" style={{ left: indicator.left, width: indicator.width }} aria-hidden />
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          const href = id === "feed" ? "/friends" : `/friends?view=${id}`;
          return (
            <Link
              key={id}
              ref={(el) => { tabRefs.current[id] = el; }}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors",
                active ? "text-lime-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring.snappy} className="ml-auto shrink-0">
        <Link
          href="/profile/demo?tab=duels"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border border-dashed border-lime/40 text-lime"
        >
          + Запустить спор
        </Link>
      </motion.div>
    </div>
  );
}
