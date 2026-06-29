"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDiary } from "./diary-context";
import { updatePrivacyAction } from "@/lib/diary-actions";
import { connectHealthAction } from "@/lib/social-actions";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle} className={cn("w-[42px] h-[25px] rounded-full relative shrink-0 transition-colors cursor-pointer", on ? "bg-good" : "bg-white/[0.12]")}>
      <span className={cn("absolute top-[2.5px] w-5 h-5 rounded-full bg-white shadow transition-all", on ? "left-[19.5px]" : "left-[2.5px]")} />
    </button>
  );
}

const VIS_CYCLE = ["PRIVATE", "FRIENDS", "PUBLIC"] as const;
const VIS_CHIP: Record<string, { label: string; cls: string }> = {
  PRIVATE: { label: "🔒 Приватно", cls: "bg-white/[0.08] text-muted-foreground" },
  FRIENDS: { label: "👥 Друзьям", cls: "bg-ice/15 text-ice" },
  PUBLIC: { label: "🌍 Всем", cls: "bg-good/15 text-good" },
};

const LOC_CYCLE = ["district", "exact"] as const;
const LOC_LABEL: Record<string, string> = { district: "район", exact: "точная" };

export function PrivacySection() {
  const { privacy, health } = useDiary();
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState(privacy);
  const [profileInSearch, setProfileInSearch] = useState(privacy.profileInSearch);
  const [diaryScope, setDiaryScope] = useState(privacy.diaryScope === "full");
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(privacy.subscriptions === "everyone");

  function vis(v: string) {
    if (v === "PUBLIC") return "all";
    if (v === "FRIENDS") return "friends";
    return "private";
  }

  function save(patch: Partial<typeof local> & { diaryScope?: string; profileInSearch?: boolean; subscriptions?: string }) {
    const next = { ...local, ...patch };
    setLocal(next);
    startTransition(async () => {
      await updatePrivacyAction({
        defaultDiary: vis(next.defaultDiary),
        defaultWishlist: vis(next.defaultWishlist),
        defaultMedia: vis(next.defaultMedia),
        defaultEvents: vis(next.defaultEvents),
        diaryScope: patch.diaryScope ?? next.diaryScope,
        friendRequests: next.friendRequests,
        subscriptions: patch.subscriptions ?? next.subscriptions,
        profileInSearch: patch.profileInSearch ?? profileInSearch,
        locationPrecision: next.locationPrecision,
      });
      toast.success("Сохранено");
    });
  }

  function cycleVis(key: "defaultDiary" | "defaultWishlist" | "defaultMedia" | "defaultEvents") {
    const idx = VIS_CYCLE.indexOf(local[key] as typeof VIS_CYCLE[number]);
    const next = VIS_CYCLE[(idx + 1) % VIS_CYCLE.length];
    save({ [key]: next });
  }

  const defaults = [
    { title: "Дневник", desc: "личная рутина", key: "defaultDiary" as const },
    { title: "Оценки медиа", desc: "мнением делишься охотнее", key: "defaultMedia" as const },
    { title: "Вишлисты", desc: "идеи подарков для друзей", key: "defaultWishlist" as const },
    { title: "События", desc: "встречи и анонсы", key: "defaultEvents" as const },
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/60 px-1">по умолчанию для нового контента</p>
      <div className="card-surface divide-y divide-white/[0.06]">
        {defaults.map((row) => {
          const v = local[row.key];
          const chip = VIS_CHIP[v] ?? VIS_CHIP.PRIVATE;
          return (
            <button key={row.title} type="button" onClick={() => cycleVis(row.key)} className="flex items-center gap-3 p-3.5 w-full text-left cursor-pointer hover:bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{row.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{row.desc}</p>
              </div>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0", chip.cls)}>{chip.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/60 px-1">доступ и видимость</p>
      <div className="card-surface divide-y divide-white/[0.06]">
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex-1">
            <p className="font-bold text-sm">Показывать дневник целиком</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">иначе — только публичные записи</p>
          </div>
          <Toggle on={diaryScope} onToggle={() => { const next = !diaryScope; setDiaryScope(next); save({ diaryScope: next ? "full" : "public_only" }); }} />
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex-1">
            <p className="font-bold text-sm">Подписки</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">кто может подписаться на тебя</p>
          </div>
          <Toggle on={subscriptionsOpen} onToggle={() => { const next = !subscriptionsOpen; setSubscriptionsOpen(next); save({ subscriptions: next ? "everyone" : "friends" }); }} />
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex-1">
            <p className="font-bold text-sm">Виден в поиске</p>
          </div>
          <Toggle on={profileInSearch} onToggle={() => { const next = !profileInSearch; setProfileInSearch(next); save({ profileInSearch: next }); }} />
        </div>
        <button
          type="button"
          onClick={() => {
            const idx = LOC_CYCLE.indexOf(local.locationPrecision as typeof LOC_CYCLE[number]);
            const next = LOC_CYCLE[(idx + 1) % LOC_CYCLE.length];
            save({ locationPrecision: next });
          }}
          className="flex items-center gap-3 p-3.5 w-full cursor-pointer hover:bg-white/[0.02]"
        >
          <div className="flex-1 text-left">
            <p className="font-bold text-sm">Геолокация в «Рядом»</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">нажми, чтобы сменить точность</p>
          </div>
          <span className="text-xs font-bold text-ice bg-ice/10 px-2.5 py-1 rounded-full">{LOC_LABEL[local.locationPrecision] ?? "район"}</span>
        </button>
      </div>

      <div className="card-surface p-4 space-y-3">
        <p className="font-bold text-sm">Apple Health / Google Fit</p>
        <p className="text-xs text-muted-foreground">Агрегаты города: шаги и дистанция для дайджеста ленты</p>
        {health.connected ? (
          <p className="text-sm text-good font-bold">✓ Подключено · {health.steps.toLocaleString("ru")} шагов · {health.distanceKm.toFixed(1)} км</p>
        ) : (
          <button
            type="button"
            onClick={() => startTransition(async () => {
              await connectHealthAction(8420, 5.2);
              toast.success("Демо-данные Health подключены");
            })}
            className="btn-action w-full text-sm py-2"
          >
            Подключить (демо)
          </button>
        )}
      </div>
    </div>
  );
}
