"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { createDuelAction, createSharedGoalAction, markDuelAction, sendDuelEmojiAction, claimGoalItemAction, completeGoalItemAction } from "@/lib/social-actions";

const EMOJIS = ["😈", "💪", "🔥", "😂"];

export function DuelsSection() {
  const { duels, sharedGoals } = useDiary();
  const [pending, startTransition] = useTransition();
  const [showDuelForm, setShowDuelForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [duelTitle, setDuelTitle] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalItems, setGoalItems] = useState("");

  const duel = duels[0];

  function heatForParticipant(participantId: string, allMarks: { participantId: string; markedAt: Date }[]) {
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (41 - i));
      return allMarks.some((m) => m.participantId === participantId && new Date(m.markedAt).toDateString() === day.toDateString());
    });
  }

  const allMarks = duel?.participants.flatMap((p) =>
    (p.marks ?? []).map((m) => ({ participantId: p.id, markedAt: m.markedAt })),
  ) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Споры</h3>
        <button type="button" onClick={() => setShowDuelForm(!showDuelForm)} className="text-xs font-bold text-lime cursor-pointer">+ Новый</button>
      </div>

      {showDuelForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={duelTitle} onChange={(e) => setDuelTitle(e.target.value)} placeholder="Название поединка" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await createDuelAction({ title: duelTitle, period: "daily", visibility: "private", friendIds: [] });
              setShowDuelForm(false);
              toast.success("Поединок создан");
            })}
            className="btn-action w-full text-sm py-2"
          >Создать</button>
        </div>
      )}

      {duel ? (
        <div className="card-surface p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heat/10 grid place-items-center text-xl">{duel.emoji ?? "👟"}</div>
            <div>
              <p className="font-bold text-[15px]">{duel.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{duel.period.toLowerCase()} · {duel.visibility === "PRIVATE" ? "🔒 приватно" : "👥 друзьям"}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {duel.participants.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-heading text-sm w-4 text-muted-foreground/50">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-lime/20 grid place-items-center text-xs font-bold text-lime">{p.user.name[0]}</div>
                <span className="flex-1 font-bold text-sm">{p.user.name}</span>
                <span className="text-xs font-bold text-heat bg-heat/10 px-2 py-0.5 rounded-full">🔥 {p.streak}</span>
              </div>
            ))}
          </div>

          {duel.participants[0] && (
            <div className="mt-2" style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: "2px" }}>
              {heatForParticipant(duel.participants[0].id, allMarks).map((on, i) => (
                <div key={i} className="aspect-square rounded-[3px]" style={{ background: on ? "rgba(200,255,87,0.6)" : "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await markDuelAction(duel.id);
              toast.success("Отмечено за сегодня");
            })}
            className="btn-action w-full text-sm py-2.5"
          >
            Отметить выполненным
          </button>

          <div className="flex gap-2 justify-center items-center text-lg">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => startTransition(() => sendDuelEmojiAction(duel.id, e))} className="hover:scale-110 transition-transform cursor-pointer">{e}</button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">Пока нет активных споров</p>
      )}

      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold">Вместе</h3>
        <button type="button" onClick={() => setShowGoalForm(!showGoalForm)} className="text-xs font-bold text-lime cursor-pointer">+ Новая цель</button>
      </div>

      {showGoalForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Название цели" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <textarea value={goalItems} onChange={(e) => setGoalItems(e.target.value)} placeholder="Пункты по строке" className="w-full min-h-[80px] rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-sm" />
          <button
            type="button"
            onClick={() => startTransition(async () => {
              await createSharedGoalAction({ title: goalTitle, items: goalItems.split("\n"), friendIds: [] });
              setShowGoalForm(false);
              toast.success("Цель создана");
            })}
            className="btn-action w-full text-sm py-2"
          >Создать</button>
        </div>
      )}

      {sharedGoals.map((goal) => {
        const items = [...goal.items].sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return 0;
        });
        const done = items.filter((i) => i.done).length;
        const total = items.length || 1;
        return (
          <div key={goal.id} className="card-surface p-4">
            <p className="font-bold text-[15px]">{goal.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{goal.members.length} участников</p>
            <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-good" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{done} из {total} пунктов готовы</p>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2.5 flex-wrap rounded-2xl border px-3 py-2.5",
                    item.done ? "border-good/25 bg-good/10" : "border-white/[0.06]",
                  )}
                >
                  <span className={cn("flex-1 text-sm font-semibold", item.done && "line-through text-muted-foreground font-medium")}>
                    {item.title}
                  </span>
                  {!item.done && !item.assigneeId && (
                    <button
                      type="button"
                      onClick={() => startTransition(() => claimGoalItemAction(item.id))}
                      className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-lime/15 text-lime border border-lime/35 cursor-pointer"
                    >
                      Беру я
                    </button>
                  )}
                  {item.assigneeId && !item.done && (
                    <button
                      type="button"
                      onClick={() => startTransition(() => completeGoalItemAction(item.id))}
                      className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-good/15 text-good border border-good/35 cursor-pointer"
                    >
                      Готово
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
