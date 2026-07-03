"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import {
  addWishlistItemAction,
  createWishlistAction,
  deleteWishlistAction,
  deleteWishlistItemAction,
  updateWishlistAction,
  updateWishlistItemAction,
} from "@/lib/social-actions";

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

function cap(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t[0].toUpperCase() + t.slice(1);
}

const inputCls = "w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm";

type Wishlist = ReturnType<typeof useDiary>["wishlists"][number];
type WishItem = Wishlist["items"][number];

export function WishlistsSection({ autoOpen }: { autoOpen?: boolean }) {
  const { wishlists } = useDiary();
  const [pending, startTransition] = useTransition();
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [openListId, setOpenListId] = useState<string | null>(null);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [visibility, setVisibility] = useState("friends");

  const [itemTitle, setItemTitle] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemLink, setItemLink] = useState("");
  const [itemComment, setItemComment] = useState("");

  useEffect(() => {
    if (autoOpen) setShowFolderForm(true);
  }, [autoOpen]);

  function resetItemFields() {
    setItemTitle("");
    setItemPrice("");
    setItemLink("");
    setItemComment("");
  }

  function resetFolderFields() {
    setTitle("");
    setOccasion("");
    setEventAt("");
    setVisibility("friends");
  }

  function openEditFolder(list: Wishlist) {
    setEditListId(list.id);
    setTitle(list.title);
    setOccasion(list.occasion ?? "");
    setEventAt(list.eventAt ? new Date(list.eventAt).toISOString().slice(0, 10) : "");
    setVisibility(list.visibility === "PUBLIC" ? "all" : list.visibility === "PRIVATE" ? "private" : "friends");
  }

  function openEditItem(item: WishItem) {
    setEditItemId(item.id);
    setItemTitle(item.title);
    setItemPrice(item.price ?? "");
    setItemLink(item.link ?? "");
    setItemComment(item.comment ?? "");
  }

  function ItemFields() {
    return (
      <>
        <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Название *" className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <input value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="Цена" className={inputCls} />
          <input value={itemLink} onChange={(e) => setItemLink(e.target.value)} placeholder="Ссылка" className={inputCls} />
        </div>
        <input value={itemComment} onChange={(e) => setItemComment(e.target.value)} placeholder="Комментарий" className={inputCls} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Вишлисты</h3>
        <button type="button" onClick={() => { resetFolderFields(); setShowFolderForm(!showFolderForm); }} className="text-xs font-bold text-lime cursor-pointer">+ Праздник</button>
      </div>

      {showFolderForm && (
        <div className="card-surface p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Сначала создай папку праздника — подарки добавишь внутри</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название списка" className={inputCls} />
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Праздник (ДР, Новый год…)" className={inputCls} />
          <input type="date" value={eventAt} onChange={(e) => setEventAt(e.target.value)} className={inputCls} />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls}>
            {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <button
            type="button"
            disabled={pending || !title.trim()}
            onClick={() => startTransition(async () => {
              try {
                await createWishlistAction({
                  title: cap(title),
                  occasion: occasion.trim() ? cap(occasion) : undefined,
                  eventAt: eventAt || null,
                  visibility,
                });
                resetFolderFields();
                setShowFolderForm(false);
                toast.success("Праздник создан — добавь подарки");
              } catch {
                toast.error("Не удалось создать");
              }
            })}
            className="btn-action w-full text-sm py-2"
          >Создать праздник</button>
        </div>
      )}

      {editListId && (
        <div className="card-surface p-4 space-y-3 border border-lime/30">
          <p className="text-xs font-bold text-lime">Редактировать праздник</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" className={inputCls} />
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Праздник" className={inputCls} />
          <input type="date" value={eventAt} onChange={(e) => setEventAt(e.target.value)} className={inputCls} />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls}>
            {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => startTransition(async () => {
              try {
                await updateWishlistAction(editListId, {
                  title: cap(title),
                  occasion: occasion.trim() ? cap(occasion) : null,
                  eventAt: eventAt || null,
                  visibility,
                });
                setEditListId(null);
                resetFolderFields();
                toast.success("Сохранено");
              } catch { toast.error("Ошибка"); }
            })} className="btn-action flex-1 text-sm py-2">Сохранить</button>
            <button type="button" disabled={pending} onClick={() => startTransition(async () => {
              if (!confirm("Удалить праздник и все подарки?")) return;
              try {
                await deleteWishlistAction(editListId);
                setEditListId(null);
                setOpenListId(null);
                resetFolderFields();
                toast.success("Удалено");
              } catch { toast.error("Ошибка"); }
            })} className="text-sm py-2 px-3 rounded-xl border border-red-500/40 text-red-400 cursor-pointer">Удалить</button>
          </div>
          <button type="button" onClick={() => { setEditListId(null); resetFolderFields(); }} className="text-xs text-muted-foreground cursor-pointer">Отмена</button>
        </div>
      )}

      {editItemId && (
        <div className="card-surface p-4 space-y-3 border border-lime/30">
          <p className="text-xs font-bold text-lime">Редактировать подарок</p>
          <ItemFields />
          <div className="flex gap-2">
            <button type="button" disabled={pending || !itemTitle.trim()} onClick={() => startTransition(async () => {
              try {
                await updateWishlistItemAction(editItemId, {
                  title: cap(itemTitle),
                  price: itemPrice.trim() || null,
                  link: itemLink.trim() || null,
                  comment: itemComment.trim() ? cap(itemComment) : null,
                });
                setEditItemId(null);
                resetItemFields();
                toast.success("Сохранено");
              } catch { toast.error("Ошибка"); }
            })} className="btn-action flex-1 text-sm py-2">Сохранить</button>
            <button type="button" disabled={pending} onClick={() => startTransition(async () => {
              if (!confirm("Удалить подарок?")) return;
              try {
                await deleteWishlistItemAction(editItemId);
                setEditItemId(null);
                resetItemFields();
                toast.success("Удалено");
              } catch { toast.error("Ошибка"); }
            })} className="text-sm py-2 px-3 rounded-xl border border-red-500/40 text-red-400 cursor-pointer">Удалить</button>
          </div>
          <button type="button" onClick={() => { setEditItemId(null); resetItemFields(); }} className="text-xs text-muted-foreground cursor-pointer">Отмена</button>
        </div>
      )}

      {wishlists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Создай папку к празднику — внутри добавишь подарки</p>
      ) : (
        wishlists.map((list) => {
          const countdown = daysUntil(list.eventAt);
          const freeCount = list.items.filter((w) => !w.reserved).length;
          const isOpen = openListId === list.id;
          return (
            <div key={list.id} className="card-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenListId(isOpen ? null : list.id)}
                className="w-full p-4 text-left cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm">{list.title}</h4>
                    {list.occasion && <p className="text-xs text-muted-foreground mt-0.5">🎉 {list.occasion}</p>}
                    {countdown && <p className="text-xs font-bold text-heat mt-0.5">{countdown}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{list.items.length} подарков · {freeCount} свободно</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs font-bold text-lime">{VIS_LABEL[list.visibility]}</span>
                    <span className={cn("text-muted-foreground transition-transform", isOpen && "rotate-90")}>›</span>
                  </div>
                </div>
              </button>

              <div className="border-t border-white/[0.06] px-3 py-2 flex flex-wrap gap-3">
                <button type="button" onClick={() => setOpenListId(isOpen ? null : list.id)} className="text-[11px] font-bold text-lime cursor-pointer">
                  {isOpen ? "Свернуть" : "Открыть"}
                </button>
                <button type="button" onClick={() => openEditFolder(list)} className="text-[11px] font-bold text-muted-foreground hover:text-lime cursor-pointer">⚙ Настройки</button>
                <button type="button" onClick={() => { setOpenListId(list.id); setAddingToList(list.id); resetItemFields(); setEditItemId(null); }} className="text-[11px] font-bold text-muted-foreground hover:text-lime cursor-pointer">+ Подарок</button>
              </div>

              {isOpen && (
                <div className="border-t border-white/[0.06] p-3 space-y-2">
                  <div className="flex gap-2 px-1">
                    <button type="button" onClick={() => { setAddingToList(list.id); resetItemFields(); setEditItemId(null); }} className="text-xs font-bold text-lime cursor-pointer">+ Ещё подарок</button>
                  </div>

                  {addingToList === list.id && (
                    <div className="card-surface p-3 space-y-2 bg-white/[0.02]">
                      <ItemFields />
                      <button type="button" disabled={pending || !itemTitle.trim()} onClick={() => startTransition(async () => {
                        try {
                          await addWishlistItemAction(list.id, {
                            title: cap(itemTitle),
                            price: itemPrice.trim() || undefined,
                            link: itemLink.trim() || undefined,
                            comment: itemComment.trim() ? cap(itemComment) : undefined,
                          });
                          setAddingToList(null);
                          resetItemFields();
                          toast.success("Подарок добавлен");
                        } catch { toast.error("Ошибка"); }
                      })} className="text-xs font-bold text-lime cursor-pointer">Добавить</button>
                    </div>
                  )}

                  {list.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Подарков пока нет</p>
                  ) : (
                    list.items.map((w) => (
                      <div key={w.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] grid place-items-center text-lg shrink-0">🎁</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{w.title}</p>
                          {w.price ? <p className="font-heading text-xs font-bold mt-0.5">{w.price}</p> : <p className="text-xs text-muted-foreground">без цены</p>}
                          {w.link && <a href={w.link} target="_blank" rel="noreferrer" className="text-[11px] text-lime mt-0.5 block truncate">ссылка</a>}
                          {w.comment && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{w.comment}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {w.reserved ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-good/15 text-good">забронировано</span>
                          ) : (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.06] text-muted-foreground">свободно</span>
                          )}
                          <button type="button" onClick={() => openEditItem(w)} className="text-[11px] font-bold text-lime cursor-pointer">Изменить</button>
                          <button type="button" onClick={() => startTransition(async () => {
                            if (!confirm("Удалить подарок?")) return;
                            try { await deleteWishlistItemAction(w.id); toast.success("Удалено"); } catch { toast.error("Ошибка"); }
                          })} className="text-[11px] font-bold text-red-400 cursor-pointer">Удалить</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
