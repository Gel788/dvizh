"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function AdminCountUp({
  value,
  className,
  duration = 1.1,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduced]);

  return (
    <span className={cn("tabular-nums", className)}>
      {display.toLocaleString("ru-RU")}
    </span>
  );
}
