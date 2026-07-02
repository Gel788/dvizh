"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ADD_PERIOD_OPTIONS, VISIBILITY_OPTIONS, TAG_SWATCHES, CHECKLIST_PRESETS, PERIODS,
  type DiaryPeriod, type TaskVisibility,
} from "./profile-data";
import { useDiary } from "./diary-context";

export function AddTaskSheet() {
  const { sheetOpen, closeSheet, period, addTask } = useDiary();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [multiLine, setMultiLine] = useState(false);
  const [newPeriod, setNewPeriod] = useState<DiaryPeriod>("today");
  const [visibility, setVisibility] = useState<TaskVisibility>("private");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState("daily");
  const [trackStreak, setTrackStreak] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [checklist, setChecklist] = useState("");
  const [tagColor, setTagColor] = useState<string>(TAG_SWATCHES[0]);
  const [priority, setPriority] = useState(false);
  const [askProof, setAskProof] = useState(false);
  const [checklistOn, setChecklistOn] = useState(false);
  const [timingOn, setTimingOn] = useState(false);
  const [timeOn, setTimeOn] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("12:00");

  useEffect(() => {
    if (sheetOpen) {
      setNewPeriod(period === "tomorrow" ? "today" : period);
      setVisibility("private");
      setText(""); setNote(""); setHashtag(""); setChecklist("");
      setDueDate(""); setIsRecurring(false); setTrackStreak(false); setReminderAt(""); setReminderOn(false);
      setTagColor(TAG_SWATCHES[0]); setChecklistOn(false); setPriority(false); setAskProof(false);
      setTimingOn(false); setTimeOn(false); setScheduledTime("12:00");
    }
  }, [sheetOpen, period]);

  if (!sheetOpen) return null;

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Напиши, что нужно сделать");
      return;
    }
    addTask({
      text: trimmed,
      note: note.trim() || undefined,
      period: newPeriod,
      visibility,
      hashtag: hashtag.trim() || undefined,
      dueDate: timingOn ? dueDate || undefined : undefined,
      hasTime: timingOn && timeOn,
      scheduledAt: timingOn && timeOn && dueDate ? `${dueDate}T${scheduledTime}:00` : undefined,
      isRecurring,
      recurrence,
      trackStreak: isRecurring && trackStreak,
      reminderAt: reminderOn && reminderAt ? reminderAt : undefined,
      checklist: checklistOn ? checklist.split("\n").map((l) => l.trim()).filter(Boolean) : [],
      multiLine,
      hashtagColor: hashtag.trim() ? tagColor : undefined,
      priority,
      askProof,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="w-full max-w-lg rounded-t-[28px] bg-popover border-t border-white/[0.08] px-5 pt-2 pb-8 max-h-[88vh] overflow-y-auto"
      >
        <div className="w-10 h-1 rounded-full bg-white/[0.12] mx-auto mb-4" />
        <h3 className="font-heading text-xl mb-4">Новая задача</h3>

        <div className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            {(["single", "list"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setMultiLine(mode === "list")} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer", (mode === "list") === multiLine ? "bg-lime text-lime-foreground" : "text-muted-foreground")}>
                {mode === "single" ? "Одна" : "Списком"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">{multiLine ? "По строке — отдельная задача" : "Что нужно сделать"}</Label>
            {multiLine ? (
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={"Молоко\nХлеб\nЯйца"} className="min-h-[100px] rounded-[13px] border-white/[0.1] bg-white/[0.04] text-sm" />
            ) : (
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Например: сходить на пробежку" className="h-12 rounded-[13px] border-white/[0.1] bg-white/[0.04] text-sm" autoFocus />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Хэштег</Label>
              <Input value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="спорт" className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04] text-sm" />
              {hashtag.trim() && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TAG_SWATCHES.map((c) => (
                    <button key={c} type="button" onClick={() => setTagColor(c)} className={cn("w-6 h-6 rounded-full border-2 cursor-pointer", tagColor === c ? "border-white scale-110" : "border-transparent")} style={{ background: c }} aria-label={`Цвет ${c}`} />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Срок</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04] text-sm" disabled={timingOn} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">Заметка</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Детали, ссылка" className="h-11 rounded-[13px] border-white/[0.1] bg-white/[0.04] text-sm" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground">Чек-лист</Label>
              <Switch checked={checklistOn} onCheckedChange={setChecklistOn} />
            </div>
            {checklistOn && (
              <>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CHECKLIST_PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => { if (p !== "Своё") setChecklist({ Покупки: "Молоко\nХлеб\nЯйца", Сборы: "Документы\nЗарядка\nКлючи", Гости: "Уборка\nМеню\nНапитки", Подарки: "Упаковка\nОткрытка\nЛента" }[p] ?? ""); }} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer", "border-white/[0.08] text-muted-foreground hover:border-lime/40")}>{p}</button>
                  ))}
                </div>
                <Textarea value={checklist} onChange={(e) => setChecklist(e.target.value)} placeholder="Пункт 1&#10;Пункт 2" className="min-h-[72px] rounded-[13px] border-white/[0.1] bg-white/[0.04] text-sm" />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {ADD_PERIOD_OPTIONS.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setNewPeriod(id)} className={cn("px-3.5 py-2 rounded-[11px] border text-[13px] font-bold cursor-pointer flex flex-col items-start gap-0.5", newPeriod === id ? "border-lime/50 bg-lime/10 text-lime" : "border-white/[0.1] bg-white/[0.04] text-muted-foreground")}>
                <span>{label}</span>
                <span className="text-[10px] opacity-80">+{PERIODS[id].xp} XP</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map(({ id, label, activeClass }) => (
              <button key={id} type="button" onClick={() => setVisibility(id)} className={cn("px-3.5 py-2 rounded-[11px] border text-[13px] font-bold cursor-pointer", visibility === id ? activeClass : "border-white/[0.1] bg-white/[0.04] text-muted-foreground")}>{label}</button>
            ))}
          </div>

          <div className="card-surface p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold">Добавить дату или время</span>
                <p className="text-[11px] text-muted-foreground">по умолчанию выкл.</p>
              </div>
              <Switch checked={timingOn} onCheckedChange={setTimingOn} />
            </div>
            {timingOn && (
              <>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Сегодня", value: new Date().toISOString().slice(0, 10) },
                    { label: "Завтра", value: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
                  ].map((d) => (
                    <button key={d.label} type="button" onClick={() => setDueDate(d.value)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer", dueDate === d.value ? "border-lime text-lime bg-lime/10" : "border-white/[0.08] text-muted-foreground")}>{d.label}</button>
                  ))}
                </div>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04] text-sm" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Добавить время</span>
                  <Switch checked={timeOn} onCheckedChange={setTimeOn} />
                </div>
                {timeOn && (
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04] text-sm" />
                )}
              </>
            )}
          </div>

          <div className="card-surface p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Повторяемая</span>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <>
                <div className="flex flex-wrap gap-2">
                  {["daily", "weekly", "monthly", "yearly"].map((r) => (
                    <button key={r} type="button" onClick={() => setRecurrence(r)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer", recurrence === r ? "border-lime text-lime" : "border-white/[0.08] text-muted-foreground")}>
                      {{ daily: "Ежедневно", weekly: "Еженедельно", monthly: "Ежемесячно", yearly: "Ежегодно" }[r]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Считать стрик</span>
                  <Switch checked={trackStreak} onCheckedChange={setTrackStreak} />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Приоритет</span>
              <Switch checked={priority} onCheckedChange={setPriority} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm font-bold block">Буду прикреплять фото</span>
                <p className="text-xs text-muted-foreground mt-0.5">После выполнения предложим добавить фото — только если включено</p>
              </div>
              <Switch checked={askProof} onCheckedChange={setAskProof} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Напоминание</span>
              <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
            </div>
            {reminderOn && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Время</Label>
                <Input type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} className="h-10 rounded-xl border-white/[0.1] bg-white/[0.04] text-sm" />
              </div>
            )}
          </div>

          {visibility === "all" && (
            <div className="rounded-[14px] border border-dashed border-[#7C5CFF]/40 bg-[#7C5CFF]/5 p-3.5">
              <p className="font-bold text-sm text-[#7C5CFF]">🏆 После сохранения — «Сделать челленджем»</p>
              <p className="text-xs text-muted-foreground mt-2">Публичная задача видна всем. Челлендж — отдельное осознанное действие.</p>
            </div>
          )}

          <button type="button" onClick={submit} className="btn-action w-full py-3 text-sm mt-2">Добавить задачу</button>
        </div>
      </motion.div>
    </div>
  );
}
