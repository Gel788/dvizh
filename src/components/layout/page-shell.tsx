import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  accent?: "lime" | "heat" | "ice";
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title, description, icon, action, accent = "lime", children, className,
}: PageShellProps) {
  const glowClass = { lime: "bg-lime/[0.12]", heat: "bg-heat/[0.08]", ice: "bg-ice/[0.08]" }[accent];
  const textClass = { lime: "text-foreground", heat: "text-heat", ice: "text-ice" }[accent];

  return (
    <div className={cn("dvizh-grid min-h-full", className)}>
      <div className="relative overflow-hidden border-b border-border px-4 py-7 lg:px-8 lg:py-8">
        <div className={cn("pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full blur-[80px]", glowClass)} />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 max-w-[1440px] mx-auto w-full">
          <div className="flex items-center gap-4">
            {icon && (
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card", textClass)}>
                {icon}
              </div>
            )}
            <div>
              <h1 className={cn("font-heading text-4xl lg:text-5xl leading-none", textClass)}>{title}</h1>
              {description && <p className="mt-2 text-sm text-muted-foreground font-medium">{description}</p>}
            </div>
          </div>
          {action && <div className="w-full sm:w-auto">{action}</div>}
        </div>
      </div>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1440px] mx-auto w-full">{children}</div>
    </div>
  );
}
