"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createSharedGoalAction, claimGoalItemAction, completeGoalItemAction } from "@/lib/social-actions";

type Goal = Awaited<ReturnType<typeof import("@/lib/social-actions").getSharedGoalsForUser>>[number];

export function FriendsTogetherPanel({ goals }: { goals: Goal[] }) {
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm(!showForm)} className="text-xs font-bold text-lime cursor-pointer">+ Новая цель</button>
      </div>
      {showForm && (
        <div className="card-surface p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название цели" className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <textarea value={items} onChange={(e) => setItems(e.target.value)} placeholder="Пункты по строке" className="w-full min-h-[80px] rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-sm" />
          <button type="button" disabled={pending} onClick={() => startTransition(async () => {
            await createSharedGoalAction({ title, items: items.split("\n"), friendIds: [] });
            setShowForm(false);
            toast.success("Цель «Вместе» создана");
          })} className="btn-action w-full text-sm py-2">Создать</button>
        </div>
      )}
      {goals.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">Совместные цели с друзьями появятся здесь</div>
      ) : goals.map((goal) => {
        const done = goal.items.filter((i) => i.done).length;
        const total = goal.items.length || 1;
        return (
          <div key={goal.id} className="card-surface p-4">
            <p className="font-bold text-[15px]">{goal.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{goal.members.length} участников</p>
            <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-good" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <div className="mt-3 space-y-2">
              {goal.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <div className={cn("w-5 h-5 rounded-md border-2 grid place-items-center shrink-0", item.done ? "bg-good border-good" : "border-white/[0.1]")}>
                    {item.done && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <span className={cn("flex-1 text-sm", item.done && "line-through text-muted-foreground")}>{item.title}</span>
                  {!item.done && !item.assigneeId && (
                    <button type="button" onClick={() => startTransition(() => claimGoalItemAction(item.id))} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/[0.08] text-muted-foreground hover:text-lime cursor-pointer">Беру я</button>
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
