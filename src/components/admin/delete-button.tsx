"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteButton({
  label,
  action,
  className,
}: {
  label: string;
  action: () => Promise<void>;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Удалить: ${label}?`)) return;
        startTransition(() => action());
      }}
      className={cn("text-heat hover:text-heat hover:bg-heat/10 cursor-pointer", className)}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
