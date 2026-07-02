"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { reserveWishlistItemAction } from "@/lib/social-actions";

type WishlistItem = {
  id: string;
  title: string;
  price: string | null;
  link: string | null;
  comment: string | null;
  reserved: boolean;
  reservedBy: string | null;
};

type Wishlist = {
  id: string;
  title: string;
  occasion: string | null;
  eventAt: Date | string | null;
  items: WishlistItem[];
};

export function FriendWishlistsSection({
  wishlists,
  viewerUsername,
}: {
  wishlists: Wishlist[];
  viewerUsername?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (wishlists.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg">Вишлисты</h2>
      {wishlists.map((list) => (
        <div key={list.id} className="space-y-2">
          <h3 className="font-bold text-sm px-1">{list.title}</h3>
          {list.occasion && <p className="text-xs text-muted-foreground px-1">🎉 {list.occasion}</p>}
          {list.items.map((w) => {
            const mine = w.reservedBy === viewerUsername;
            return (
              <div key={w.id} className="card-surface flex items-center gap-3 p-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] grid place-items-center text-xl shrink-0">🎁</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{w.title}</p>
                  {w.price && <p className="text-xs font-bold mt-0.5">{w.price}</p>}
                  {w.comment && <p className="text-[11px] text-muted-foreground mt-0.5">{w.comment}</p>}
                </div>
                {w.reserved ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-good/15 text-good shrink-0">
                    {mine ? "ты забронировал" : "занято"}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => {
                      try {
                        await reserveWishlistItemAction(w.id);
                        toast.success("Забронировано — сюрприз сохранён");
                      } catch {
                        toast.error("Не удалось забронировать");
                      }
                    })}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-lime/10 text-lime border border-lime/20 cursor-pointer shrink-0"
                  >
                    Забронировать
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
