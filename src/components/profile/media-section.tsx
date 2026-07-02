"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { addMediaItemAction, updateMediaItemAction } from "@/lib/social-actions";

const TABS = [
  { id: "FILM", label: "Фильмы" },
  { id: "SERIES", label: "Сериалы" },
  { id: "BOOK", label: "Книги" },
  { id: "GAME", label: "Игры" },
] as const;

const STATUS_TABS = [
  { id: "ALL", label: "Все" },
  { id: "WANT", label: "Хочу" },
  { id: "IN_PROGRESS", label: "В процессе" },
  { id: "DONE", label: "Закончил" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  WANT: "хочу", IN_PROGRESS: "в процессе", DONE: "завершено",
};

const STATUS_NEXT: Record<string, string> = {
  WANT: "progress", IN_PROGRESS: "done", DONE: "want",
};

const STATUS_COLOR: Record<string, string> = {
  WANT: "#7C5CFF", IN_PROGRESS: "#FFB020", DONE: "#22B07D",
};

const EMOJI: Record<string, string> = { FILM: "🎬", SERIES: "📺", BOOK: "📚", GAME: "🎮" };

const VIS_OPTIONS = [
  { v: "private", l: "🔒 Приватно" },
  { v: "friends", l: "👥 Друзьям" },
  { v: "all", l: "🌍 Всем" },
];

export function MediaSection({ autoOpen }: { autoOpen?: boolean }) {
  const { media } = useDiary();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("FILM");
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]["id"]>("ALL");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("want");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editReview, setEditReview] = useState("");
  const [editVisibility, setEditVisibility] = useState("friends");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (autoOpen) setShowForm(true);
  }, [autoOpen]);

  const filtered = media.filter((m) => {
    if (m.type !== tab) return false;
    if (statusTab === "ALL") return true;
    return m.status === statusTab;
  });

  function openEdit(m: (typeof media)[0]) {
    setEditingId(m.id);
    setEditRating(m.rating ?? 0);
    setEditReview(m.review ?? "");
    setEditVisibility(m.visibility === "PUBLIC" ? "all" : m.visibility === "FRIENDS" ? "friends" : "private");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer", tab === t.id ? "bg-lime text-lime-foreground border-lime" : "bg-card border-white/[0.07] text-muted-foreground")}>
            {t.label}
          </button>
        ))}
        <button type="button" onClick={() => setShowForm(!showForm)} className="shrink-0 px-3.5 py-2 rounded-full text-xs font-bold text-lime border border-lime/30 cursor-pointer">+</button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {STATUS_TABS.map((s) => (
          <button key={s.id} type="button" onClick={() => setStatusTab(s.id)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer", statusTab === s.id ? "border-lime/40 text-lime bg-lime/10" : "border-white/[0.07] text-muted-foreground")}>
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <div className="flex gap-2 flex-wrap">
            {(["want", "progress", "done"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer", status === s ? "border-lime/40 text-lime bg-lime/10" : "border-white/[0.07] text-muted-foreground")}>
                {s === "want" ? "Хочу" : s === "progress" ? "В процессе" : "Закончил"}
              </button>
            ))}
          </div>
          {status === "done" && (
            <>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={cn("text-lg cursor-pointer", n <= rating ? "text-[#FFB020]" : "text-muted-foreground/40")}>★</button>
                ))}
              </div>
              <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Рецензия (опционально)" rows={2} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm resize-none" />
            </>
          )}
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm">
            {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <button
            type="button"
            disabled={pending || !title.trim()}
            onClick={() => startTransition(async () => {
              await addMediaItemAction({
                type: tab.toLowerCase(),
                title,
                status,
                rating: status === "done" && rating > 0 ? rating : undefined,
                review: review.trim() || undefined,
                visibility,
              });
              setTitle("");
              setReview("");
              setRating(0);
              setShowForm(false);
              toast.success("Добавлено в медиалист");
            })}
            className="btn-action w-full text-sm py-2"
          >Добавить</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Список пуст — добавь первый пункт</p>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="card-surface p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-[52px] rounded-md grid place-items-center text-lg shrink-0" style={{ background: `${STATUS_COLOR[m.status]}22` }}>
                  {EMOJI[m.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{m.title}</p>
                  {m.rating && <p className="text-[#FFB020] text-xs mt-0.5">{"★".repeat(m.rating)} · твоя оценка</p>}
                  {m.review && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.review}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => startTransition(async () => {
                    const next = STATUS_NEXT[m.status] ?? "want";
                    await updateMediaItemAction(m.id, { status: next });
                  })}
                  className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0 cursor-pointer"
                  style={{ background: `${STATUS_COLOR[m.status]}1c`, color: STATUS_COLOR[m.status] }}
                >
                  {STATUS_LABEL[m.status]}
                </button>
              </div>
              {editingId === m.id ? (
                <div className="border-t border-white/[0.06] pt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setEditRating(n)} className={cn("text-lg cursor-pointer", n <= editRating ? "text-[#FFB020]" : "text-muted-foreground/40")}>★</button>
                    ))}
                  </div>
                  <textarea value={editReview} onChange={(e) => setEditReview(e.target.value)} placeholder="Рецензия" rows={2} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs resize-none" />
                  <select value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)} className="w-full h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-xs">
                    {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startTransition(async () => {
                      await updateMediaItemAction(m.id, {
                        status: "done",
                        rating: editRating || null,
                        review: editReview.trim() || null,
                        visibility: editVisibility,
                      });
                      setEditingId(null);
                      toast.success("Сохранено");
                    })} className="btn-action flex-1 text-xs py-2">Сохранить</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-muted-foreground px-3 cursor-pointer">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {m.status !== "DONE" && (
                    <button type="button" onClick={() => startTransition(async () => {
                      await updateMediaItemAction(m.id, { status: "done" });
                      openEdit({ ...m, status: "DONE" });
                    })} className="text-[11px] font-bold text-lime cursor-pointer">Завершить</button>
                  )}
                  {m.status === "DONE" && (
                    <button type="button" onClick={() => openEdit(m)} className="text-[11px] font-bold text-muted-foreground hover:text-lime cursor-pointer">Оценка и рецензия</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
