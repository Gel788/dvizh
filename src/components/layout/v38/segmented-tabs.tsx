"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = { value: string; label: string; href?: string };

type Props = {
  tabs: readonly Tab[];
  active: string;
  className?: string;
  onChange?: (value: string) => void;
};

export function SegmentedTabs({
  tabs,
  active,
  className,
  onChange,
}: Props) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-[22px] border border-border bg-card p-1 shadow-[0_8px_18px_rgba(16,19,15,0.06)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = active === tab.value;

        const cls = cn(
          "flex-1 rounded-[17px] px-2 py-2 text-[11px] font-bold text-center whitespace-nowrap transition-all duration-180 cursor-pointer select-none",
          selected
            ? "bg-[var(--black-card)] text-white shadow-[0_0_0_1px_rgba(185,244,0,0.15)]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        );

        if (onChange) {
          return (
            <button key={tab.value} type="button" onClick={() => onChange(tab.value)} className={cls}>
              {tab.label}
            </button>
          );
        }

        if (!tab.href) {
          return (
            <span key={tab.value} className={cls}>
              {tab.label}
            </span>
          );
        }

        return (
          <Link key={tab.value} href={tab.href} className={cls}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
