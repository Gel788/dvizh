import { cn } from "@/lib/utils";

export function RefSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-ref min-h-full px-4 pt-3 pb-[150px] lg:pb-[150px]", className)}>
      {children}
    </div>
  );
}
