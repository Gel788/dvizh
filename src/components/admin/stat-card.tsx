import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent = "lime",
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "lime" | "heat" | "ice" | "muted";
  icon?: LucideIcon;
  className?: string;
}) {
  const styles = {
    lime: {
      value: "text-lime",
      icon: "bg-lime/10 text-lime ring-lime/20",
      bar: "bg-lime",
    },
    heat: {
      value: "text-heat",
      icon: "bg-heat/10 text-heat ring-heat/20",
      bar: "bg-heat",
    },
    ice: {
      value: "text-ice",
      icon: "bg-ice/10 text-ice ring-ice/20",
      bar: "bg-ice",
    },
    muted: {
      value: "text-foreground",
      icon: "bg-white/[0.04] text-muted-foreground ring-white/[0.08]",
      bar: "bg-white/20",
    },
  }[accent];

  return (
    <div
      className={cn(
        "admin-stat group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card/60 p-4 lg:p-5",
        "transition-[border-color,transform] duration-200 hover:border-white/[0.12] hover:-translate-y-px",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px opacity-80", styles.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className={cn("mt-2 font-heading text-3xl lg:text-[2.1rem] leading-none tabular-nums", styles.value)}>
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              styles.icon,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
