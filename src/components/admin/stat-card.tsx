import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent = "lime",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "lime" | "heat" | "ice";
}) {
  const accentClass = {
    lime: "text-neon-lime",
    heat: "text-heat",
    ice: "text-ice",
  }[accent];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 lg:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className={cn("mt-2 font-heading text-3xl lg:text-4xl leading-none", accentClass)}>{value}</p>
      {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
    </div>
  );
}
