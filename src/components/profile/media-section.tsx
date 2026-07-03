"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { addMediaItemAction, deleteMediaItemAction, updateMediaItemAction } from "@/lib/social-actions";

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

const STATUS_API: Record<string, string> = {
  WANT: "want", IN_PROGRESS: "progress", DONE: "done",
};

const STATUS_COLOR: Record<string, string> = {
  WANT: "#7C5CFF", IN_PROGRESS: "#FFB020", DONE: "#22B07D",
};

const EMOJI: Record<string, string> = { FILM: "🎬", SERIES: "📺", BOOK: "📚", GAME: "🎮" };
const TYPE_API: Record<string, string> = { FILM: "film", SERIES: "series", BOOK: "book", GAME: "game" };

const VIS_OPTIONS = [
  { v: "private", l: "🔒 Приватно" },
  { v: "friends", l: "👥 Друзьям" },
  { v: "all", l: "🌍 Всем" },
];

const inputCls = "w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

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
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("film");
  const [editStatus, setEditStatus] = useState("want");
  const [editRating, setEditRating] = useState(0);
  const [editReview, setEditReview] = useState("");
  const [editVisibility, setEditVisibility] = useState("friends");
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editCoverData, setEditCoverData] = useState<string | null | undefined>(undefined);
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
    setEditTitle(m.title);
    setEditType(TYPE_API[m.type] ?? "film");
    setEditStatus(STATUS_API[m.status] ?? "want");
    setEditRating(m.rating ?? 0);
    setEditReview(m.review ?? "");
    setEditVisibility(m.visibility === "PUBLIC" ? "all" : m.visibility === "FRIENDS" ? "friends" : "private");
    setEditCoverPreview(m.coverUrl ?? null);
    setEditCoverData(undefined);
  }

  function closeEdit() {
    setEditingId(null);
    setEditCoverPreview(null);
    setEditCoverData(undefined);
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
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" className={inputCls} />
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
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls}>
            {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <button
            type="button"
            disabled={pending || !title.trim()}
            onClick={() => startTransition(async () => {
              await addMediaItemAction({ type: tab.toLowerCase(), title, status, rating: status === "done" && rating > 0 ? rating : undefined, review: review.trim() || undefined, visibility });
              setTitle(""); setReview(""); setRating(0); setShowForm(false);
              toast.success("Добавлено в медиалист");
            })}
            className="btn-action w-full text-sm py-2"
          >Добавить</button>
        </div>
      )}

      {editingId && (
        <div className="card-surface p-4 space-y-3 border border-lime/30">
          <p className="text-xs font-bold text-lime">Редактировать</p>
          {editCoverPreview && (
            <img src={editCoverPreview} alt="" className="w-full max-h-40 object-cover rounded-xl" />
          )}
          <input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const data = await fileToDataUrl(f);
            setEditCoverPreview(data);
            setEditCoverData(data);
          }} />
          {editCoverPreview && (
            <button type="button" className="text-xs text-red-400 cursor-pointer" onClick={() => { setEditCoverPreview(null); setEditCoverData(null); }}>Убрать фото</button>
          )}
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Название" className={inputCls} />
          <select value={editType} onChange={(e) => setEditType(e.target.value)} className={inputCls}>
            <option value="film">🎬 Фильм</option>
            <option value="series">📺 Сериал</option>
            <option value="book">📚 Книга</option>
            <option value="game">🎮 Игра</option>
          </select>
          <div className="flex gap-2 flex-wrap">
            {(["want", "progress", "done"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setEditStatus(s)} className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer", editStatus === s ? "border-lime/40 text-lime bg-lime/10" : "border-white/[0.07] text-muted-foreground")}>
                {s === "want" ? "Хочу" : s === "progress" ? "В процессе" : "Закончил"}
              </button>
            ))}
          </div>
          {editStatus === "done" && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setEditRating(n)} className={cn("text-lg cursor-pointer", n <= editRating ? "text-[#FFB020]" : "text-muted-foreground/40")}>★</button>
              ))}
            </div>
          )}
          <textarea value={editReview} onChange={(e) => setEditReview(e.target.value)} placeholder="Отзыв" rows={2} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm resize-none" />
          <select value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)} className={inputCls}>
            {VIS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" disabled={pending || !editTitle.trim()} onClick={() => startTransition(async () => {
              await updateMediaItemAction(editingId, {
                title: editTitle,
                type: editType,
                status: editStatus,
                rating: editStatus === "done" && editRating > 0 ? editRating : null,
                review: editReview.trim() || null,
                visibility: editVisibility,
                ...(editCoverData !== undefined ? { coverUrl: editCoverData } : {}),
              });
              closeEdit();
              toast.success("Сохранено");
            })} className="btn-action flex-1 text-sm py-2">Сохранить</button>
            <button type="button" disabled={pending} onClick={() => startTransition(async () => {
              if (!confirm("Удалить из медиалиста?")) return;
              await deleteMediaItemAction(editingId);
              closeEdit();
              toast.success("Удалено");
            })} className="text-sm py-2 px-3 rounded-xl border border-red-500/40 text-red-400 cursor-pointer">Удалить</button>
          </div>
          <button type="button" onClick={closeEdit} className="text-xs text-muted-foreground cursor-pointer">Отмена</button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Список пуст — добавь первый пункт</p>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="card-surface overflow-hidden">
              <div className="flex gap-3 p-3">
                <div className="w-14 h-[72px] rounded-xl overflow-hidden shrink-0 grid place-items-center text-xl" style={{ background: `${STATUS_COLOR[m.status]}18` }}>
                  {m.coverUrl ? <img src={m.coverUrl} alt="" className="w-full h-full object-cover" /> : EMOJI[m.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-snug">{m.title}</p>
                  <p className="text-[10px] font-bold mt-1 uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[m.status]}</p>
                  {m.rating ? <p className="text-[#FFB020] text-xs mt-1">{"★".repeat(m.rating)}</p> : null}
                  {m.review ? <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.review}</p> : null}
                </div>
              </div>
              <div className="border-t border-white/[0.06] px-3 py-2 flex gap-3">
                <button type="button" onClick={() => openEdit(m)} className="text-[11px] font-bold text-lime cursor-pointer">✎ Изменить</button>
                <button type="button" onClick={() => startTransition(async () => {
                  if (!confirm(`Удалить «${m.title}»?`)) return;
                  try { await deleteMediaItemAction(m.id); toast.success("Удалено"); } catch { toast.error("Ошибка"); }
                })} className="text-[11px] font-bold text-red-400 cursor-pointer">Удалить</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
