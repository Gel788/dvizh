"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { duelMarkedToday, msUntilPeriodEnd } from "@/lib/duel-utils";
import type { DuelPeriod } from "@prisma/client";
import { markDuelAction, sendDuelEmojiAction } from "@/lib/social-actions";

type DuelParticipant = {
  id: string;
  streak: number;
  totalMarks: number;
  user: { id: string; name: string; username: string; avatar: string | null };
  marks: { markedAt: Date | string }[];
};

export type DuelDetail = {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  period: DuelPeriod;
  visibility: string;
  remindersOn: boolean;
  participants: DuelParticipant[];
  leader?: DuelParticipant | null;
};

const EMOJIS = ["😈", "💪", "🔥", "😂"];

function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}ч ${m}м`;
}

function heatMarks(marks: { markedAt: Date | string }[]) {
  return Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    return marks.some((m) => new Date(m.markedAt).toDateString() === day.toDateString());
  });
}

export function DuelDetailView({ duel, onClone }: { duel: DuelDetail; onClone?: () => void }) {
  const [countdown, setCountdown] = useState(msUntilPeriodEnd(duel.period));
  const [pending, startTransition] = useTransition();
  const leader = duel.participants[0];

  useEffect(() => {
    const t = setInterval(() => setCountdown(msUntilPeriodEnd(duel.period)), 60000);
    return () => clearInterval(t);
  }, [duel.period]);

  const periodLabel = { DAILY: "день", WEEKLY: "неделя", MONTHLY: "месяц", YEARLY: "год" }[duel.period] ?? "период";

  return (
    <div className="card-surface p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-heat/10 grid place-items-center text-2xl shrink-0">{duel.emoji ?? "⚔️"}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base leading-tight">{duel.title}</h3>
          {duel.description && <p className="text-xs text-muted-foreground mt-1">{duel.description}</p>}
          <p className="text-[11px] text-muted-foreground mt-1">
            {periodLabel} · {duel.visibility === "PRIVATE" ? "🔒 приватно" : "👥 друзьям"}
            {duel.remindersOn ? " · 🔔 напоминания" : ""}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 flex justify-between text-xs">
        <span className="text-muted-foreground">До конца {periodLabel}а</span>
        <span className="font-bold text-lime">{formatCountdown(countdown)}</span>
      </div>

      {leader && (
        <p className="text-xs font-bold text-heat">
          Лидер: {leader.user.name} · серия {leader.streak}
        </p>
      )}

      <div className="space-y-3">
        {duel.participants.map((p, idx) => {
          const markedToday = p.marks.some((m) => duelMarkedToday(new Date(m.markedAt)));
          return (
            <div key={p.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-heading text-sm w-4 text-muted-foreground">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-lime/20 grid place-items-center text-xs font-bold text-lime">
                  {p.user.name[0]}
                </div>
                <span className="flex-1 font-bold text-sm">{p.user.name}</span>
                <span className="text-xs font-bold text-heat bg-heat/10 px-2 py-0.5 rounded-full">🔥 {p.streak}</span>
                {markedToday && <span className="text-[10px] font-bold text-lime">сегодня ✓</span>}
              </div>
              <div className="grid gap-0.5 ml-11" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
                {heatMarks(p.marks).map((on, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[3px]"
                    style={{ background: on ? "rgba(200,255,87,0.55)" : "rgba(255,255,255,0.04)" }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          await markDuelAction(duel.id);
          toast.success("Отмечено за сегодня");
        })}
        className="btn-action w-full text-sm py-2.5 cursor-pointer"
      >
        Отметить сегодня
      </button>

      <div className="flex gap-2 justify-center text-lg">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => startTransition(() => sendDuelEmojiAction(duel.id, e))}
            className="hover:scale-110 transition-transform cursor-pointer"
          >
            {e}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const res = await fetch(`/api/v1/duels/${duel.id}/clone`, { method: "POST", credentials: "include" });
          if (!res.ok) {
            toast.error("Не удалось создать копию");
            return;
          }
          toast.success("Такой же спор создан");
          onClone?.();
        })}
        className={cn(
          "w-full rounded-xl border border-dashed border-lime/40 py-2 text-xs font-bold text-lime",
          "hover:bg-lime/5 transition-colors cursor-pointer",
        )}
      >
        Создать такой же спор
      </button>
    </div>
  );
}
