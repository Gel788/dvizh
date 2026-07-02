"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { finishOnboardingAction } from "@/lib/onboarding-actions";

const MASCOTS = [
  { id: 0, emoji: "🐱", name: "Котик" },
  { id: 1, emoji: "🐶", name: "Корги" },
  { id: 2, emoji: "🐼", name: "Панда" },
];

const PRESETS = [
  "Прогуляться 20 минут",
  "Записать 3 идеи",
  "Разобрать стол",
  "Позвонить другу",
  "Выпить воды",
  "Сделать зарядку",
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [mascot, setMascot] = useState(0);
  const [city, setCity] = useState("Москва");
  const [district, setDistrict] = useState("");
  const [diaryVis, setDiaryVis] = useState("private");
  const [sportVis, setSportVis] = useState("friends");
  const [task, setTask] = useState("Прогуляться 20 минут");
  const [priority, setPriority] = useState(false);
  const [pending, setPending] = useState(false);

  const steps = ["Привет", "Имя", "Маскот", "Район", "Приватность", "Первое дело"];
  const lastStep = steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto px-5 py-8">
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-lime" : "bg-white/[0.08]")} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex-1 space-y-4">
          <h1 className="font-heading text-3xl text-neon-lime">Добро пожаловать в ДВЖ</h1>
          <p className="text-muted-foreground">ДВЖ — ежедневник-соцсеть: дела, друзья, события рядом, вызовы и маскот, который растёт вместе с тобой.</p>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-heading text-xl font-bold">Как тебя называть?</h2>
          <p className="text-sm text-muted-foreground">Имя видят друзья. Поменять можно в профиле. Телефон и адрес не запрашиваем.</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Имя или псевдоним"
            className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm"
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-heading text-xl font-bold">Выбери спутника</h2>
          <div className="grid grid-cols-3 gap-3">
            {MASCOTS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMascot(m.id)}
                className={cn("card-surface p-4 text-center cursor-pointer", mascot === m.id && "ring-2 ring-lime")}
              >
                <span className="text-4xl block">{m.emoji}</span>
                <span className="text-xs font-bold mt-2 block">{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-heading text-xl font-bold">Выбери район</h2>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город" className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Район (без точного адреса)" className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-heading text-xl font-bold">Приватность по умолчанию</h2>
          <p className="text-sm text-muted-foreground">Потом всё можно изменить в каждом деле.</p>
          {[
            { key: "diary", label: "Личные дела", val: diaryVis, set: setDiaryVis },
            { key: "sport", label: "Прогулки и спорт", val: sportVis, set: setSportVis },
          ].map((row) => (
            <div key={row.key} className="space-y-2">
              <p className="text-sm font-bold">{row.label}</p>
              <div className="flex gap-2">
                {(["private", "friends", "all"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => row.set(v)}
                    className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer", row.val === v ? "border-lime/40 text-lime bg-lime/10" : "border-white/[0.08] text-muted-foreground")}
                  >
                    {v === "private" ? "Только я" : v === "friends" ? "Друзья" : "Все"}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground rounded-xl border border-white/[0.08] px-3 py-2">Район: показываем только общий район — точный адрес нигде не отображается.</p>
          <p className="text-xs text-muted-foreground">Фото — отдельный тумблер «Буду прикреплять фото» в настройках каждого дела.</p>
        </div>
      )}

      {step === 5 && (
        <div className="flex-1 space-y-4">
          <h2 className="font-heading text-xl font-bold">Добавь первое дело</h2>
          <p className="text-sm text-muted-foreground">Начни с простого. Дату, время, повтор и приоритет можно добавить потом.</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setTask(p)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer", task === p ? "border-lime/40 text-lime" : "border-white/[0.08]")}>
                {p}
              </button>
            ))}
          </div>
          <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Свой вариант" className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm" />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
            Добавить в приоритет
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-6">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="flex-1 h-12 rounded-xl border border-white/[0.08] font-bold text-sm cursor-pointer">
            Назад
          </button>
        )}
        {step < lastStep ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="flex-1 h-12 rounded-xl bg-lime text-lime-foreground font-bold text-sm cursor-pointer">
            Далее
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setPending(true);
              void finishOnboardingAction({
                displayName: displayName.trim() || undefined,
                mascotVariant: mascot,
                city,
                district,
                defaultDiary: diaryVis,
                defaultMedia: sportVis,
                defaultWishlist: sportVis,
                firstTaskTitle: task,
                firstTaskPriority: priority,
              });
            }}
            className="flex-1 h-12 rounded-xl bg-lime text-lime-foreground font-bold text-sm cursor-pointer disabled:opacity-50"
          >
            Начать
          </button>
        )}
      </div>
    </div>
  );
}
