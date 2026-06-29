"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createDuelAction, markDuelAction, sendDuelEmojiAction } from "@/lib/social-actions";

type Duel = Awaited<ReturnType<typeof import("@/lib/diary-actions").getDuelsForUser>>[number];

const EMOJIS = ["😈", "💪", "🔥", "😂"];

export function FriendsDuelsPanel({ duels }: { duels: Duel[] }) {
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const duel = duels[0];

  const allMarks = duel?.participants.flatMap((p) =>
    (p.marks ?? []).map((m) => ({ participantId: p.id, markedAt: m.markedAt })),
  ) ?? [];

  function heat(participantId: string) {
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (41 - i));
      return allMarks.some((m) => m.participantId === participantId && new Date(m.markedAt).toDateString() === day.toDateString());
    });
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название поединка" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <button type="button" disabled={pending} onClick={() => startTransition(async () => {
            await createDuelAction({ title, period: "daily", visibility: "friends", friendIds: [] });
            setShowForm(false);
            toast.success("Спор запущен");
          })} className="btn-action w-full text-sm py-2">Запустить</button>
        </div>
      )}

      {duel ? (
        <div className="card-surface p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heat/10 grid place-items-center text-xl">{duel.emoji ?? "⚔️"}</div>
            <div>
              <p className="font-bold text-[15px]">{duel.title}</p>
              <p className="text-xs text-muted-foreground">{duel.participants.map((p) => p.user.name).join(" × ")}</p>
            </div>
          </div>
          {duel.participants.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="font-heading text-sm w-4 text-muted-foreground">{idx + 1}</span>
              <div className="w-8 h-8 rounded-full bg-lime/20 grid place-items-center text-xs font-bold text-lime">{p.user.name[0]}</div>
              <span className="flex-1 font-bold text-sm">{p.user.name}</span>
              <span className="text-xs font-bold text-heat bg-heat/10 px-2 py-0.5 rounded-full">🔥 {p.streak}</span>
            </div>
          ))}
          {duel.participants[0] && (
            <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
              {heat(duel.participants[0].id).map((on, i) => (
                <div key={i} className="aspect-square rounded-[3px]" style={{ background: on ? "rgba(200,255,87,0.55)" : "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          )}
          <button type="button" disabled={pending} onClick={() => startTransition(async () => {
            await markDuelAction(duel.id);
            toast.success("Отмечено за сегодня");
          })} className="btn-action w-full text-sm py-2.5">Отметить выполненным</button>
          <div className="flex gap-2 justify-center text-lg">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => startTransition(() => sendDuelEmojiAction(duel.id, e))} className="hover:scale-110 cursor-pointer">{e}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-surface p-8 text-center">
          <p className="text-3xl mb-2">⚔️</p>
          <p className="font-heading text-lg text-lime/80">Нет активных споров</p>
          <button type="button" onClick={() => setShowForm(true)} className="btn-action mt-4 text-sm">+ Запустить спор</button>
        </div>
      )}
    </div>
  );
}
