import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-table overflow-hidden rounded-2xl border border-white/[0.07] bg-card/40 ring-1 ring-white/[0.03]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AdminTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "bg-[#0e0e14]/95 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground border-b border-white/[0.06]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle border-b border-white/[0.04] text-foreground/80",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function AdminTr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-white/[0.025]", className)}>{children}</tr>;
}

export function AdminSection({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="truncate font-heading text-lg text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
