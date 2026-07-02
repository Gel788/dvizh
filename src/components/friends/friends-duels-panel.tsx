"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreateDuelForm } from "./create-duel-form";
import { DuelDetailView, type DuelDetail } from "./duel-detail-view";

type Duel = DuelDetail & { myParticipantId?: string };

export function FriendsDuelsPanel({
  duels,
  autoCreate = false,
}: {
  duels: Duel[];
  autoCreate?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(autoCreate);
  const [activeId, setActiveId] = useState(duels[0]?.id ?? "");

  const active = duels.find((d) => d.id === activeId) ?? duels[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-muted-foreground">Споры с друзьями</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold text-lime cursor-pointer"
        >
          {showForm ? "Скрыть" : "+ Новый спор"}
        </button>
      </div>

      {showForm && (
        <CreateDuelForm
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {duels.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {duels.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveId(d.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer",
                active?.id === d.id ? "bg-lime text-lime-foreground border-lime" : "border-white/[0.08] text-muted-foreground",
              )}
            >
              {d.emoji ?? "⚔️"} {d.title.slice(0, 24)}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <DuelDetailView duel={active} onClone={() => router.refresh()} />
      ) : (
        <div className="card-surface p-8 text-center">
          <p className="text-3xl mb-2">⚔️</p>
          <p className="font-heading text-lg text-lime/80">Нет активных споров</p>
          <button type="button" onClick={() => setShowForm(true)} className="btn-action mt-4 text-sm cursor-pointer">
            + Запустить спор
          </button>
        </div>
      )}
    </div>
  );
}
