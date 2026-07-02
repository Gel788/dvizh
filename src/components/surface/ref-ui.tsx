"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function RefEmojiAvatar({
  emoji,
  size = 40,
}: {
  emoji: string;
  size?: number;
}) {
  const radius = Math.round(size * 0.35);
  return (
    <div
      className="shrink-0 grid place-items-center bg-[#fff7dc]"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.45 }}
    >
      {emoji}
    </div>
  );
}

export function RefGhostButton({
  children,
  href,
  onClick,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cls = cn(
    "inline-flex h-9 items-center justify-center rounded-full border border-[var(--ref-line)]",
    "bg-[var(--ref-paper)] px-3 text-[12px] font-extrabold text-[var(--ref-ink)]",
    "shadow-[var(--ref-shadow)] hover:bg-white transition-colors cursor-pointer",
    className,
  );
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function RefSectionHeader({
  title,
  emoji,
  action,
  actionHref,
}: {
  title: string;
  emoji?: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-[18px] pb-2.5">
      {emoji && <span className="text-[19px] leading-none" aria-hidden>{emoji}</span>}
      <h2 className="flex-1 text-[22px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--ref-ink)]">
        {title}
      </h2>
      {action && (
        actionHref
          ? <RefGhostButton href={actionHref}>{action}</RefGhostButton>
          : <RefGhostButton>{action}</RefGhostButton>
      )}
    </div>
  );
}

export function RefChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "green" | "blue" | "gold";
}) {
  const tones = {
    neutral: "ref-chip-neutral",
    green: "ref-chip-green",
    blue: "ref-chip-blue",
    gold: "ref-chip-gold",
  };
  return <span className={cn("ref-chip", tones[tone])}>{label}</span>;
}

export function RefEventTile({
  href,
  leading,
  title,
  subtitle,
  chips = [],
  trailing,
  onClick,
}: {
  href?: string;
  leading: string;
  title: string;
  subtitle: string;
  chips?: string[];
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <RefEmojiAvatar emoji={leading} />
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--ref-ink)]">{title}</p>
        <p className="text-[12px] font-semibold leading-[1.25] ref-muted mt-0.5">{subtitle}</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {chips.map((c) => (
              <RefChip key={c} label={c} tone={c.includes("XP") ? "green" : "neutral"} />
            ))}
          </div>
        )}
      </div>
      {trailing ?? (
        <span className="text-[22px] leading-none text-[#bab0a7] shrink-0" aria-hidden>›</span>
      )}
    </>
  );

  const cls = "ref-card flex items-center gap-2.5 p-3 my-1 active:scale-[0.99] transition-transform";

  if (href) {
    return <Link href={href} className={cls}>{body}</Link>;
  }
  return (
    <button type="button" onClick={onClick} className={cn(cls, "w-full text-left cursor-pointer")}>
      {body}
    </button>
  );
}

export function RefTipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="ref-tip-banner mt-2.5 w-full">
      {children}
    </div>
  );
}

export function RefQuickCard({
  emoji,
  title,
  subtitle,
  href,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link href={href} className="ref-card block p-[10px_11px] active:scale-[0.98] transition-transform">
      <span className="text-xl leading-none">{emoji}</span>
      <p className="text-[14.5px] font-bold text-[var(--ref-ink)] mt-1">{title}</p>
      <p className="text-[10.5px] font-bold ref-muted truncate">{subtitle}</p>
    </Link>
  );
}

export function RefPulseMetricTile({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[18px] border border-[#e8dccd] bg-[rgba(255,255,255,0.88)] px-2.5 min-h-[62px]">
      <div className="w-8 h-8 shrink-0 rounded-[13px] bg-[#f2f9d9] grid place-items-center text-[15px]">
        {emoji}
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-extrabold leading-none tracking-[-0.04em] text-[var(--ref-ink)]">{value}</p>
        <p className="text-[10.5px] font-bold ref-muted mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}
