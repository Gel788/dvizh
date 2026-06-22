"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { CITIES, MOSCOW_DISTRICTS } from "@/lib/geo";
import { cn } from "@/lib/utils";

const feedTabs = [
  { value: "all",       label: "Всё" },
  { value: "following", label: "Подписки" },
  { value: "nearby",    label: "Рядом" },
];

const typeOptions = [
  { value: "ALL",          label: "Всё" },
  { value: "ACTIVITY",     label: "Движ" },
  { value: "CHALLENGE",    label: "Челленджи" },
  { value: "ANNOUNCEMENT", label: "Объявы" },
];

export function FeedFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const feed     = params.get("feed")     ?? "all";
  const city     = params.get("city")     ?? "Москва";
  const type     = params.get("type")     ?? "ALL";
  const district = params.get("district") ?? "";
  const radius   = Number(params.get("radius") ?? 10);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card/80 backdrop-blur-sm p-4 space-y-3">
      {/* Feed tabs */}
      <div className="flex gap-1.5">
        {feedTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => update("feed", tab.value)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
              feed === tab.value
                ? "bg-lime text-lime-foreground shadow-[0_4px_16px_rgba(200,255,87,0.25)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type + City + Sheet */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={city} onValueChange={(v) => update("city", v)}>
          <SelectTrigger className="w-[148px] h-9 rounded-xl border-white/[0.07] bg-white/[0.04] text-xs font-semibold cursor-pointer">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent className="border-white/[0.09] bg-popover">
            {CITIES.map((c) => (
              <SelectItem key={c} value={c} className="cursor-pointer text-xs font-medium">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => update("type", v)}>
          <SelectTrigger className="w-[136px] h-9 rounded-xl border-white/[0.07] bg-white/[0.04] text-xs font-semibold cursor-pointer">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent className="border-white/[0.09] bg-popover">
            {typeOptions.map((t) => (
              <SelectItem key={t.value} value={t.value} className="cursor-pointer text-xs font-medium">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors cursor-pointer">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Ещё
          </SheetTrigger>
          <SheetContent className="border-l border-white/[0.07] bg-popover">
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl">Фильтры</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Район</Label>
                <Select value={district || "all"} onValueChange={(v) => update("district", v === "all" ? "" : v)}>
                  <SelectTrigger className="cursor-pointer rounded-xl border-white/[0.07] bg-white/[0.04]">
                    <SelectValue placeholder="Все районы" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.09] bg-popover">
                    <SelectItem value="all" className="cursor-pointer">Все районы</SelectItem>
                    {MOSCOW_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d} className="cursor-pointer">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Радиус</Label>
                  <span className="text-sm font-bold text-lime">{radius} км</span>
                </div>
                <Slider
                  value={[radius]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;
                    update("radius", String(v));
                  }}
                  className="[&_[role=slider]]:bg-lime [&_[role=slider]]:border-lime/50"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
