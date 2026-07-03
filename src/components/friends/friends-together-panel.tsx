"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CreateTogetherForm } from "./create-together-form";
import {
  claimGoalItemAction,
  completeGoalItemAction,
  respondSharedGoalAction,
} from "@/lib/social-actions";

type GoalItem = {
  id: string;
  title: string;
  done: boolean;
  sortOrder?: number;
  assigneeId: string | null;
  assignee?: { id?: string; name: string; username: string } | null;
};

type GoalMember = {
  userId: string;
  status?: "INVITED" | "ACCEPTED" | "DECLINED";
  user: { id: string; name: string; username: string };
};

type Goal = {
  id: string;
  title: string;
  eventAt: Date | string | null;
  members: GoalMember[];
  items: GoalItem[];
};

function sortItems(items: GoalItem[]) {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function acceptedMemberNames(members: GoalMember[]) {
  return members
    .filter((m) => m.status !== "DECLINED")
    .map((m) => m.user.name)
    .join(" · ");
}

export function FriendsTogetherPanel({
  goals,
  userId,
  autoCreate = false,
}: {
  goals: Goal[];
  userId: string;
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
        <GoalCard
          goal={active}
          userId={userId}
          pending={pending}
          startTransition={startTransition}
          onUpdated={() => router.refresh()}
        />
      )}
    </div>
  );
}

function GoalCard({
  goal,
  userId,
  pending,
  startTransition,
  onUpdated,
}: {
  goal: Goal;
  userId: string;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onUpdated?: () => void;
}) {
  const myMember = goal.members.find((m) => m.userId === userId);
  const invitePending = myMember?.status === "INVITED";
  const items = sortItems(goal.items);
  const done = items.filter((i) => i.done).length;
  const total = items.length || 1;
  const eventLabel = goal.eventAt
    ? format(new Date(goal.eventAt), "d MMMM yyyy", { locale: ru })
    : null;

  return (
    <div className="card-surface p-4">
      {invitePending && (
        <div className="mb-4 rounded-2xl border border-lime/25 bg-lime/8 p-4">
          <p className="text-sm font-bold">Тебя добавили в «{goal.title}»</p>
          <p className="text-xs text-muted-foreground mt-1">Примешь участие в общем списке?</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await respondSharedGoalAction(goal.id, false);
                  toast.success("Ты отказался от участия");
                  onUpdated?.();
                })
              }
              className="flex-1 rounded-xl border border-white/[0.1] px-3 py-2 text-xs font-bold text-muted-foreground cursor-pointer"
            >
              Отказаться
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await respondSharedGoalAction(goal.id, true);
                  toast.success("Ты в списке 🤝");
                  onUpdated?.();
                })
              }
              className="flex-1 rounded-xl bg-lime px-3 py-2 text-xs font-bold text-lime-foreground cursor-pointer"
            >
              Участвую
            </button>
          </div>
        </div>
      )}

      <p className="font-bold text-[15px]">{goal.title}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {acceptedMemberNames(goal.members)}
        {eventLabel ? ` · 📅 ${eventLabel}` : ""}
      </p>
      <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{done} из {total} готово</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const canClaim = !item.done && !item.assigneeId && !invitePending;
          const canComplete = !item.done && item.assigneeId === userId;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2.5 flex-wrap rounded-2xl border px-3 py-2.5",
                item.done
                  ? "border-good/25 bg-good/10"
                  : "border-white/[0.06] bg-white/[0.02]",
              )}
            >
              <span
                className={cn(
                  "flex-1 text-sm min-w-[120px] font-semibold",
                  item.done && "line-through text-muted-foreground font-medium",
                )}
              >
                {item.title}
              </span>
              {item.assignee && !item.done && (
                <span className="text-[10px] font-bold text-ice bg-ice/10 px-2 py-0.5 rounded-full">
                  {item.assignee.name}
                </span>
              )}
              {canClaim && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await claimGoalItemAction(item.id);
                      toast.success("Пункт за тобой");
                      onUpdated?.();
                    })
                  }
                  className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-lime/15 text-lime border border-lime/35 hover:bg-lime/25 cursor-pointer"
                >
                  Беру я
                </button>
              )}
              {canComplete && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await completeGoalItemAction(item.id);
                      toast.success("Готово!");
                      onUpdated?.();
                    })
                  }
                  className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-good/15 text-good border border-good/35 cursor-pointer"
                >
                  Готово
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
