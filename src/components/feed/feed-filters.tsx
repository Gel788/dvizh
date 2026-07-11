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
import { V38_FEED_SCOPES, type V38FeedScope } from "@/lib/v38-nav";
import { SegmentedTabs } from "@/components/layout/v38/segmented-tabs";

const typeOptions = [
  { value: "ALL", label: "Всё" },
  { value: "ACTIVITY", label: "Движ" },
  { value: "CHALLENGE", label: "Челленджи" },
  { value: "ANNOUNCEMENT", label: "События" },
];

function parseFeedScope(raw: string | null): V38FeedScope {
  if (raw === "friends" || raw === "nearby" || raw === "district" || raw === "global") return raw;
  if (raw === "following") return "friends";
  if (raw === "all") return "city";
  return "city";
}

export function FeedFilters({ basePath = "/" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const scope = parseFeedScope(params.get("scope") ?? params.get("feed"));
  const city = params.get("city") ?? "Москва";
  const type = params.get("type") ?? "ALL";
  const district = params.get("district") ?? "";
  const radius = Number(params.get("radius") ?? 10);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "scope" && value === "city") next.delete("scope");
    if (key === "feed") next.delete("feed");
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const scopeTabs = V38_FEED_SCOPES.map((tab) => {
    const next = new URLSearchParams(params.toString());
    next.delete("feed");
    if (tab.value === "city") next.delete("scope");
    else next.set("scope", tab.value);
    const qs = next.toString();
    return { ...tab, href: qs ? `${basePath}?${qs}` : basePath };
  });

  return (
    <div className="rounded-[22px] border border-border bg-card p-3 space-y-3 shadow-sm">
      {basePath === "/" && (
        <SegmentedTabs tabs={scopeTabs} active={scope} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {basePath === "/" && (
          <Select value={city} onValueChange={(v) => update("city", v)}>
            <SelectTrigger className="w-[148px] h-9 rounded-xl border-border bg-background text-xs font-semibold cursor-pointer">
              <SelectValue placeholder="Город" />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              {CITIES.map((c) => (
                <SelectItem key={c} value={c} className="cursor-pointer text-xs font-medium">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={type} onValueChange={(v) => update("type", v)}>
          <SelectTrigger className="w-[136px] h-9 rounded-xl border-border bg-background text-xs font-semibold cursor-pointer">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            {typeOptions.map((t) => (
              <SelectItem key={t.value} value={t.value} className="cursor-pointer text-xs font-medium">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Ещё
          </SheetTrigger>
          <SheetContent className="border-l border-border bg-popover">
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl">Фильтры</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Район</Label>
                <Select value={district || "all"} onValueChange={(v) => update("district", v === "all" ? "" : v)}>
                  <SelectTrigger className="cursor-pointer rounded-xl border-border bg-background">
                    <SelectValue placeholder="Все районы" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
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
