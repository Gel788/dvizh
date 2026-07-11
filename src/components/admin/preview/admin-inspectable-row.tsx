"use client";

import { cn } from "@/lib/utils";
import { useAdminPreviewOptional } from "@/components/admin/preview/admin-preview-provider";

export function AdminInspectableRow({
  inspectId,
  children,
  className,
}: {
  inspectId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useAdminPreviewOptional();

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!ctx) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, label, [data-no-inspect]")) return;
    ctx.select(inspectId);
  };

  const active = ctx?.selectedId === inspectId;

  return (
    <tr
      onClick={handleClick}
      className={cn(
        "transition-colors",
        ctx && "cursor-pointer",
        active
          ? "bg-lime/[0.08] ring-1 ring-inset ring-lime/25"
          : "hover:bg-white/[0.025]",
        className,
      )}
    >
      {children}
    </tr>
  );
}
