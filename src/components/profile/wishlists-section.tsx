"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useDiary } from "./diary-context";
import { createWishlistAction, reserveWishlistItemAction } from "@/lib/social-actions";

const VIS_LABEL: Record<string, string> = {
  PRIVATE: "🔒 приватно", FRIENDS: "👥 друзьям", PUBLIC: "🌍 всем",
};

function daysUntil(iso: string | Date | null | undefined) {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return "прошло";
  if (diff === 0) return "сегодня";
  return `через ${diff} ${diff === 1 ? "день" : diff < 5 ? "дня" : "дней"}`;
}

export function WishlistsSection() {
  const { wishlists } = useDiary();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Вишлисты</h3>
        <button type="button" onClick={() => setShowForm(!showForm)} className="text-xs font-bold text-lime cursor-pointer">+ Новый</button>
      </div>

      {showForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название списка" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await createWishlistAction({ title, visibility: "friends" });
              setShowForm(false);
              toast.success("Вишлист создан");
            })}
            className="btn-action w-full text-sm py-2"
          >Создать</button>
        </div>
      )}

      {wishlists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Создай список желаний к празднику</p>
      ) : (
        wishlists.map((list) => {
          const countdown = daysUntil(list.eventAt);
          const freeCount = list.items.filter((w) => !w.reserved).length;
          return (
            <div key={list.id} className="space-y-2">
              <div className="flex items-center justify-between px-1 gap-2">
                <div>
                  <h4 className="font-bold text-sm">{list.title}</h4>
                  {list.occasion && <p className="text-xs text-muted-foreground">🎉 {list.occasion}</p>}
                  {countdown && <p className="text-xs font-bold text-heat mt-0.5">{countdown}</p>}
                </div>
                <span className="text-xs font-bold text-lime shrink-0">{VIS_LABEL[list.visibility]}</span>
              </div>
              <p className="text-[11px] text-muted-foreground px-1">{freeCount} свободно · {list.items.length - freeCount} забронировано</p>
              {list.items.map((w) => (
                <div key={w.id} className="card-surface flex items-center gap-3 p-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] grid place-items-center text-xl shrink-0">🎁</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{w.title}</p>
                    {w.price ? <p className="font-heading text-xs font-bold mt-0.5">{w.price}</p> : <p className="text-xs text-muted-foreground">без цены</p>}
                  </div>
                  {w.reserved ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-good/15 text-good">забронировано</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        await reserveWishlistItemAction(w.id);
                        toast.success("Подарок забронирован");
                      })}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.06] text-muted-foreground hover:text-lime cursor-pointer"
                    >Забронировать</button>
                  )}
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
