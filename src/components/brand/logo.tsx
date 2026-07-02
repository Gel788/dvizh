import { cn } from "@/lib/utils";

export function Logo({ size = "md", className, showTagline = false }: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl lg:text-6xl",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("font-heading text-neon-lime -skew-x-3 leading-none", sizes[size])}>
        ДВЖ
      </span>
      {showTagline && (
        <span className="mt-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
          Твой ритм — твоя жизнь
        </span>
      )}
    </div>
  );
}
