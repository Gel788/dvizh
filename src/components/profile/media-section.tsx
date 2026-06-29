"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { addMediaItemAction } from "@/lib/social-actions";

const TABS = [
  { id: "FILM", label: "Фильмы" },
  { id: "SERIES", label: "Сериалы" },
  { id: "BOOK", label: "Книги" },
  { id: "GAME", label: "Игры" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  WANT: "хочу", IN_PROGRESS: "в процессе", DONE: "завершено",
};

const STATUS_COLOR: Record<string, string> = {
  WANT: "#7C5CFF", IN_PROGRESS: "#FFB020", DONE: "#22B07D",
};

const EMOJI: Record<string, string> = { FILM: "🎬", SERIES: "📺", BOOK: "📚", GAME: "🎮" };

export function MediaSection() {
  const { media } = useDiary();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("FILM");
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = media.filter((m) => m.type === tab);

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

      {showForm && (
        <div className="card-surface p-4 flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <button
            type="button"
            onClick={() => startTransition(async () => {
              await addMediaItemAction({ type: tab.toLowerCase(), title, status: "want", visibility: "public" });
              setTitle("");
              setShowForm(false);
            })}
            className="btn-action text-xs px-4"
          >Добавить</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Список пуст — добавь первый пункт</p>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="card-surface flex items-center gap-3 p-3">
              <div className="w-10 h-[52px] rounded-md grid place-items-center text-lg shrink-0" style={{ background: `${STATUS_COLOR[m.status]}22` }}>
                {EMOJI[m.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{m.title}</p>
                {m.rating && <p className="text-[#FFB020] text-xs mt-0.5">{"★".repeat(m.rating)} · твоя оценка</p>}
                {m.review && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.review}</p>}
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0" style={{ background: `${STATUS_COLOR[m.status]}1c`, color: STATUS_COLOR[m.status] }}>
                {STATUS_LABEL[m.status]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
