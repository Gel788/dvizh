import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]", className)}>
      <table className="w-full min-w-[720px] text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35 border-b border-white/[0.06]", className)}>
      {children}
    </th>
  );
}

export function AdminTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3 align-middle border-b border-white/[0.04] text-white/75", className)}>
      {children}
    </td>
  );
}
