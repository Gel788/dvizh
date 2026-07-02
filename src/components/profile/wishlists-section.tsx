"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDiary } from "./diary-context";
import { addWishlistItemAction, createWishlistAction } from "@/lib/social-actions";

const VIS_LABEL: Record<string, string> = {
  PRIVATE: "🔒 приватно", FRIENDS: "👥 друзьям", PUBLIC: "🌍 всем",
};

const VIS_OPTIONS = [
  { v: "private", l: "🔒 Приватно" },
  { v: "friends", l: "👥 Друзьям" },
  { v: "all", l: "🌍 Всем" },
];

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

export function WishlistsSection({ autoOpen }: { autoOpen?: boolean }) {
  const { wishlists } = useDiary();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [itemTitle, setItemTitle] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemLink, setItemLink] = useState("");
  const [itemComment, setItemComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpen) setShowForm(true);
  }, [autoOpen]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Вишлисты</h3>
        <button type="button" onClick={() => setShowForm(!showForm)} className="text-xs font-bold text-lime cursor-pointer">+ Новый</button>
      </div>

      {showForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название списка" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Праздник (ДР, Новый год…)" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <input type="date" value={eventAt} onChange={(e) => setEventAt(e.target.value)} className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm">
            {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <p className="text-[11px] text-muted-foreground">Первый подарок (опционально)</p>
          <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Название подарка" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="Цена" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
            <input value={itemLink} onChange={(e) => setItemLink(e.target.value)} placeholder="Ссылка" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          </div>
          <input value={itemComment} onChange={(e) => setItemComment(e.target.value)} placeholder="Комментарий" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <button
            type="button"
            disabled={pending || !title.trim()}
            onClick={() => startTransition(async () => {
              try {
                await createWishlistAction({
                  title,
                  occasion: occasion.trim() || undefined,
                  eventAt: eventAt || null,
                  visibility,
                  items: itemTitle.trim()
                    ? [{ title: itemTitle, price: itemPrice, link: itemLink, comment: itemComment }]
                    : undefined,
                });
                setTitle("");
                setOccasion("");
                setEventAt("");
                setItemTitle("");
                setItemPrice("");
                setItemLink("");
                setItemComment("");
                setShowForm(false);
                toast.success("Вишлист создан");
              } catch {
                toast.error("Не удалось создать");
              }
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
                    {w.link && <a href={w.link} target="_blank" rel="noreferrer" className="text-[11px] text-lime mt-0.5 block truncate">ссылка</a>}
                    {w.comment && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{w.comment}</p>}
                  </div>
                  {w.reserved ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-good/15 text-good shrink-0">забронировано</span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.06] text-muted-foreground shrink-0">свободно</span>
                  )}
                </div>
              ))}
              {addingToList === list.id ? (
                <div className="card-surface p-3 space-y-2">
                  <input id={`item-${list.id}`} placeholder="Название" className="w-full h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }} />
                  <button type="button" onClick={() => {
                    const el = document.getElementById(`item-${list.id}`) as HTMLInputElement | null;
                    const t = el?.value?.trim();
                    if (!t) return;
                    startTransition(async () => {
                      await addWishlistItemAction(list.id, { title: t });
                      setAddingToList(null);
                      toast.success("Подарок добавлен");
                    });
                  }} className="text-xs font-bold text-lime cursor-pointer">Добавить</button>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingToList(list.id)} className="text-xs font-bold text-muted-foreground hover:text-lime px-1 cursor-pointer">+ Подарок</button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
