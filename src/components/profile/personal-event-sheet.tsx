"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VISIBILITY_OPTIONS } from "./profile-data";
import { createPersonalEventAction } from "@/lib/diary-actions";
import type { TaskVisibility } from "./profile-data";

const EVENT_TYPES = [
  { id: "birthday", label: "ДР", emoji: "🎂" },
  { id: "anniversary", label: "Годовщина", emoji: "💍" },
  { id: "holiday", label: "Праздник", emoji: "🎉" },
  { id: "payment", label: "Оплата", emoji: "💳" },
  { id: "meeting", label: "Встреча", emoji: "🤝" },
  { id: "appointment", label: "Запись", emoji: "📋" },
  { id: "household", label: "Бытовое", emoji: "🏠" },
  { id: "custom", label: "Своё", emoji: "✨" },
] as const;

export function PersonalEventSheet({
  open,
  onClose,
  defaultDate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("custom");
  const [eventDate, setEventDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState("12:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [visibility, setVisibility] = useState<TaskVisibility>("private");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Название обязательно");
      return;
    }
    setBusy(true);
    try {
      const scheduledAt = hasTime ? `${eventDate}T${time}:00` : undefined;
      const reminderAt = reminderOn && hasTime ? scheduledAt : undefined;
      await createPersonalEventAction({
        title: trimmed,
        eventType,
        eventDate,
        hasTime,
        scheduledAt,
        isRecurring,
        recurrence: isRecurring ? "yearly" : undefined,
        reminderAt,
        visibility,
        note: note.trim() || undefined,
      });
      toast.success("Событие добавлено");
      onCreated?.();
      onClose();
      setTitle("");
      setNote("");
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="w-full max-w-lg rounded-t-[28px] bg-popover border-t border-white/[0.08] px-5 pt-2 pb-8 max-h-[88vh] overflow-y-auto"
      >
        <div className="w-10 h-1 rounded-full bg-white/[0.12] mx-auto mb-4" />
        <h3 className="font-heading text-xl mb-4">Новое событие</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="День рождения мамы" className="h-11 rounded-xl border-white/[0.1] bg-white/[0.04]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setEventType(t.id)} className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer", eventType === t.id ? "border-lime bg-lime/10 text-lime" : "border-white/[0.08] text-muted-foreground")}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Дата</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground">Время</Label>
                <Switch checked={hasTime} onCheckedChange={setHasTime} />
              </div>
              {hasTime && (
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04]" />
              )}
            </div>
          </div>
          <div className="card-surface p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Повторять ежегодно</span>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Напоминание</span>
              <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map(({ id, label, activeClass }) => (
              <button key={id} type="button" onClick={() => setVisibility(id)} className={cn("px-3 py-2 rounded-[11px] border text-[13px] font-bold cursor-pointer", visibility === id ? activeClass : "border-white/[0.1] bg-white/[0.04] text-muted-foreground")}>{label}</button>
            ))}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Заметка" className="min-h-[72px] rounded-xl border-white/[0.1] bg-white/[0.04]" />
          <button type="button" disabled={busy} onClick={submit} className="btn-action w-full py-3 text-sm">Сохранить событие</button>
        </div>
      </motion.div>
    </div>
  );
}
