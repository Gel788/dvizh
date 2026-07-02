"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CreateTogetherForm } from "./create-together-form";
import { claimGoalItemAction, completeGoalItemAction } from "@/lib/social-actions";

type GoalItem = {
  id: string;
  title: string;
  done: boolean;
  assigneeId: string | null;
  assignee?: { name: string; username: string } | null;
};

type Goal = {
  id: string;
  title: string;
  eventAt: Date | string | null;
  members: { user: { name: string; username: string } }[];
  items: GoalItem[];
};

export function FriendsTogetherPanel({
  goals,
  autoCreate = false,
}: {
  goals: Goal[];
  autoCreate?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(autoCreate);
  const [activeId, setActiveId] = useState(goals[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const active = goals.find((g) => g.id === activeId) ?? goals[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-muted-foreground">Общие списки с друзьями</p>
        <button type="button" onClick={() => setShowForm(!showForm)} className="text-xs font-bold text-lime cursor-pointer">
          {showForm ? "Скрыть" : "+ Новый список"}
        </button>
      </div>

      {showForm && (
        <CreateTogetherForm
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {goals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveId(g.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer",
                active?.id === g.id ? "bg-lime text-lime-foreground border-lime" : "border-white/[0.08] text-muted-foreground",
              )}
            >
              {g.title.slice(0, 28)}
            </button>
          ))}
        </div>
      )}

      {!active ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">
          Совместные списки появятся здесь — создай первый с друзьями
        </div>
      ) : (
        <GoalCard goal={active} pending={pending} startTransition={startTransition} onUpdated={() => router.refresh()} />
      )}
    </div>
  );
}

function GoalCard({
  goal,
  pending,
  startTransition,
  onUpdated,
}: {
  goal: Goal;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onUpdated?: () => void;
}) {
  const done = goal.items.filter((i) => i.done).length;
  const total = goal.items.length || 1;
  const eventLabel = goal.eventAt
    ? format(new Date(goal.eventAt), "d MMMM yyyy", { locale: ru })
    : null;

  return (
    <div className="card-surface p-4">
      <p className="font-bold text-[15px]">{goal.title}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {goal.members.map((m) => m.user.name).join(" · ")}
        {eventLabel ? ` · 📅 ${eventLabel}` : ""}
      </p>
      <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{done} из {total} готово</p>
      <div className="mt-3 space-y-2">
        {goal.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 flex-wrap">
            <div
              className={cn(
                "w-5 h-5 rounded-md border-2 grid place-items-center shrink-0",
                item.done ? "bg-good border-good" : "border-white/[0.1]",
              )}
            >
              {item.done && <span className="text-white text-[10px]">✓</span>}
            </div>
            <span className={cn("flex-1 text-sm min-w-[120px]", item.done && "line-through text-muted-foreground")}>
              {item.title}
            </span>
            {item.assignee && !item.done && (
              <span className="text-[10px] font-bold text-ice bg-ice/10 px-2 py-0.5 rounded-full">
                {item.assignee.name}
              </span>
            )}
            {!item.done && !item.assigneeId && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await claimGoalItemAction(item.id);
                  toast.success("Пункт за тобой");
                  onUpdated?.();
                })}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/[0.08] text-muted-foreground hover:text-lime cursor-pointer"
              >
                Беру я
              </button>
            )}
            {!item.done && item.assigneeId && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await completeGoalItemAction(item.id);
                  toast.success("Готово!");
                  onUpdated?.();
                })}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-lime/10 text-lime border border-lime/30 cursor-pointer"
              >
                Готово
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
