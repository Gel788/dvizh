"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { copyMediaItemAction } from "@/lib/social-actions";

type Props = {
  activity: {
    title: string;
    metadata: string | null;
    user: { username: string };
  };
};

function parseMediaId(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { mediaId?: string };
    return parsed.mediaId ?? null;
  } catch {
    return null;
  }
}

export function CopyMediaButton({ activity }: Props) {
  const [pending, startTransition] = useTransition();
  const mediaId = parseMediaId(activity.metadata);

  return (
    <button
      type="button"
      disabled={pending || !mediaId}
      onClick={() => startTransition(async () => {
        if (!mediaId) return;
        try {
          await copyMediaItemAction(mediaId);
          toast.success(`«${activity.title}» добавлено в твой медиалист`);
        } catch {
          toast.error("Не удалось скопировать");
        }
      })}
      className="mt-3 w-full rounded-[13px] px-3 py-2.5 text-xs font-bold text-ice bg-ice/10 border border-ice/20 hover:bg-ice/15 transition-colors cursor-pointer disabled:opacity-50"
    >
      + Забрать себе
    </button>
  );
}
