import { cn } from "@/lib/utils";

export function RefSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-ref min-h-full px-4 py-4 lg:px-6 lg:py-5 pb-28", className)}>
      {children}
    </div>
  );
}
