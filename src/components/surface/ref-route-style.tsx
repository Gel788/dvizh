"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const REF_PATHS = new Set(["/", "/today"]);

export function RefRouteStyle() {
  const pathname = usePathname();
  const base = pathname.split("?")[0] ?? pathname;
  const active = REF_PATHS.has(base);

  useEffect(() => {
    document.documentElement.classList.toggle("ref-route-active", active);
    return () => document.documentElement.classList.remove("ref-route-active");
  }, [active]);

  return null;
}
