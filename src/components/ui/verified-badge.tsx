import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("inline-block h-4 w-4 shrink-0 text-sky-400", className)}
      aria-label="Верифицированный аккаунт"
    />
  );
}
