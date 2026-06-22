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
  const glowClass = {
    lime: "bg-lime/[0.07]",
    heat: "bg-heat/[0.06]",
    ice:  "bg-ice/[0.06]",
  }[accent];

  const textClass = {
    lime: "text-neon-lime",
    heat: "text-heat",
    ice:  "text-ice",
  }[accent];

  return (
    <div className={cn("dvizh-grid min-h-full", className)}>
      {/* Page header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] px-4 py-7 lg:px-8 lg:py-8">
        <div className={cn("pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full blur-[80px]", glowClass)} />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {icon && (
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]", textClass)}>
                {icon}
              </div>
            )}
            <div>
              <h1 className={cn("font-heading text-4xl lg:text-5xl leading-none", textClass)}>
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground font-medium">{description}</p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
