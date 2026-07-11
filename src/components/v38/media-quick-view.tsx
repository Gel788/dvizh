"use client";

import { useSearchParams } from "next/navigation";
import { DiaryProvider } from "@/components/profile/diary-context";
import { MediaSection } from "@/components/profile/media-section";
import type { DiaryBundle } from "@/lib/diary-actions";

export function MediaQuickView({
  bundle,
  autoOpen,
}: {
  bundle: DiaryBundle;
  autoOpen?: boolean;
}) {
  const searchParams = useSearchParams();
  const open = autoOpen || searchParams.get("create") === "1";

  return (
    <DiaryProvider initial={bundle}>
      <div className="max-w-2xl mx-auto">
        <MediaSection autoOpen={open} />
      </div>
    </DiaryProvider>
  );
}
