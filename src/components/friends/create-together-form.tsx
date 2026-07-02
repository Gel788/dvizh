"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Friend = { id: string; name: string; username: string };

export function CreateTogetherForm({ onCreated }: { onCreated?: () => void }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/v1/friends?view=picker", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .catch(() => setFriends([]));
  }, []);

  function toggleFriend(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Укажите название списка");
      return;
    }
    if (selected.length < 1) {
      toast.error("Выбери хотя бы одного друга");
      return;
    }
    const lines = items.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!lines.length) {
      toast.error("Добавь хотя бы один пункт");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/v1/shared-goals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          items: lines,
          friendIds: selected,
          eventAt: eventAt || null,
        }),
      });
      if (!res.ok) {
        toast.error("Не удалось создать список");
        return;
      }
      toast.success("Список «Вместе» создан 🤝");
      setTitle("");
      setItems("");
      setEventAt("");
      setSelected([]);
      onCreated?.();
    });
  }

  return (
    <div className="card-surface p-4 space-y-3">
      <p className="font-bold text-sm">Новый список вместе</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название — поездка, праздник, покупки"
        className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm"
      />
      <input
        type="date"
        value={eventAt}
        onChange={(e) => setEventAt(e.target.value)}
        className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm"
      />
      <textarea
        value={items}
        onChange={(e) => setItems(e.target.value)}
        placeholder="Пункты списка — каждый с новой строки"
        rows={4}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-sm resize-none"
      />
      <p className="text-[11px] text-muted-foreground">Участники ({selected.length} выбрано)</p>
      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
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
        Создать вместе
      </Button>
    </div>
  );
}
