"use client";

import { useSearchParams } from "next/navigation";
import { DiaryProvider } from "@/components/profile/diary-context";
import { WishlistsSection } from "@/components/profile/wishlists-section";
import type { DiaryBundle } from "@/lib/diary-actions";

export function WishlistQuickView({
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
        <WishlistsSection autoOpen={open} />
      </div>
    </DiaryProvider>
  );
}
