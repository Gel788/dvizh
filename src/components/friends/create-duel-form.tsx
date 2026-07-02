"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Friend = { id: string; name: string; username: string };

const PERIODS = [
  { id: "daily", label: "Каждый день" },
  { id: "weekly", label: "Каждую неделю" },
  { id: "monthly", label: "Каждый месяц" },
] as const;

const VIS = [
  { id: "friends", label: "Друзья" },
  { id: "private", label: "Только я" },
] as const;

export function CreateDuelForm({ onCreated }: { onCreated?: () => void }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("daily");
  const [visibility, setVisibility] = useState("friends");
  const [remindersOn, setRemindersOn] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/v1/friends?view=picker", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .catch(() => setFriends([]));
  }, []);

  function toggleFriend(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 7) {
        toast.message("Максимум 7 друзей (8 участников с тобой)");
        return prev;
      }
      return [...prev, id];
    });
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Укажите название спора");
      return;
    }
    if (selected.length < 1) {
      toast.error("Выбери хотя бы одного друга (минимум 2 участника)");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/v1/duels", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          period,
          visibility,
          remindersOn,
          friendIds: selected,
        }),
      });
      if (!res.ok) {
        toast.error("Не удалось создать спор");
        return;
      }
      toast.success("Спор создан ⚔️");
      setTitle("");
      setDescription("");
      setSelected([]);
      onCreated?.();
    });
  }

  return (
    <div className="card-surface p-4 space-y-3">
      <p className="font-bold text-sm">Новый спор</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название — например, 10 000 шагов"
        className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Условие / правила (необязательно)"
        rows={2}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm resize-none"
      />
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer",
              period === p.id ? "bg-lime text-lime-foreground border-lime" : "border-white/[0.08] text-muted-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {VIS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVisibility(v.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer",
              visibility === v.id ? "bg-ice/20 text-ice border-ice/30" : "border-white/[0.08] text-muted-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={remindersOn} onChange={(e) => setRemindersOn(e.target.checked)} className="rounded" />
        Напоминания о споре
      </label>
      <p className="text-[11px] text-muted-foreground">Участники: ты + {selected.length} из {friends.length} друзей (2–8)</p>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {friends.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => toggleFriend(f.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold border cursor-pointer",
              selected.includes(f.id) ? "bg-lime/15 text-lime border-lime/40" : "border-white/[0.08] text-muted-foreground",
            )}
          >
            {f.name}
          </button>
        ))}
      </div>
      <Button type="button" disabled={pending} onClick={submit} className="w-full font-bold cursor-pointer">
        Запустить спор
      </Button>
    </div>
  );
}
