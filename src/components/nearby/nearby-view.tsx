"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CityMap } from "@/components/map/city-map";
import { cn } from "@/lib/utils";
import { joinChallengeAction, joinEventAction } from "@/lib/actions";
import type { NearbyItem } from "@/lib/nearby-data";
import { filterNearbyItem } from "@/lib/nearby-data";
import type { PostType } from "@prisma/client";
import { MotionEnter } from "@/components/ui/motion-surface";

const MAP_FILTERS = ["Все", "Спонсоры", "События", "Люди"] as const;

type Props = {
  city: string;
  coords: { lat: number; lng: number };
  localItems: NearbyItem[];
  globalItems: NearbyItem[];
};

export function NearbyView({ city, coords, localItems, globalItems }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const scope = params.get("scope") === "global" ? "global" : "local";
  const mapFilter = params.get("map") ?? "Все";

  const list = scope === "global" ? globalItems : localItems;
  const filteredList = list.filter((item) => filterNearbyItem(item, mapFilter));

  const mapMarkers = useMemo(() => {
    return filteredList
      .filter((item): item is NearbyItem & { lat: number; lng: number } => item.lat != null && item.lng != null)
      .map((item) => ({
        id: item.postId ?? item.id,
        title: item.name,
        content: item.meta,
        type: (item.kind === "person" ? "ACTIVITY" : item.kind === "event" ? "ANNOUNCEMENT" : "CHALLENGE") as PostType,
        lat: item.lat,
        lng: item.lng,
        district: city,
        emoji: item.emoji,
        color: item.color,
      }));
  }, [filteredList, city]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`/nearby?${next.toString()}`);
  }

  function handleJoin(item: NearbyItem) {
    startTransition(async () => {
      try {
        if (item.challengeId) {
          await joinChallengeAction(item.challengeId);
          toast.success("Ты в челлендже!");
        } else if (item.eventId) {
          await joinEventAction(item.eventId);
          toast.success("Отмечено — идёшь!");
        }
        router.refresh();
      } catch {
        toast.error("Не удалось присоединиться");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Карта с оверлеем */}
      <div className="relative rounded-[22px] overflow-hidden border border-white/[0.08] bg-[#0d0d12]">
        <CityMap markers={mapMarkers} center={[coords.lat, coords.lng]} compact />
        <div className="absolute top-3 left-3 right-3 z-[500] flex gap-1.5 overflow-x-auto scrollbar-none pointer-events-none">
          {MAP_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setParam("map", f)}
              className={cn(
                "shrink-0 pointer-events-auto rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-colors cursor-pointer border",
                mapFilter === f
                  ? "bg-lime text-lime-foreground border-lime"
                  : "bg-black/55 text-white/85 border-white/10 hover:border-white/25",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <span className="rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-lime whitespace-nowrap">
            📍 Ты здесь · радиус 1,5 км
          </span>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setParam("scope", "local")}
          className={cn(
            "flex-1 rounded-[14px] py-2.5 text-xs font-bold transition-colors cursor-pointer",
            scope === "local" ? "bg-lime text-lime-foreground" : "border border-white/[0.07] bg-card text-muted-foreground",
          )}
        >
          Рядом · {localItems.length}
        </button>
        <button
          type="button"
          onClick={() => setParam("scope", "global")}
          className={cn(
            "flex-1 rounded-[14px] py-2.5 text-xs font-bold transition-colors cursor-pointer",
            scope === "global" ? "bg-lime text-lime-foreground" : "border border-white/[0.07] bg-card text-muted-foreground",
          )}
        >
          Глобальные · {globalItems.length}
        </button>
      </div>

      {/* Список */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-sm text-muted-foreground">В этой категории пока пусто</p>
          </div>
        ) : (
          filteredList.map((item, i) => (
            <MotionEnter key={item.id} index={i}>
            <div className="card-surface flex items-center gap-3 p-3.5 t-card-press">
              <div
                className="w-11 h-11 rounded-[14px] grid place-items-center text-xl shrink-0"
                style={{ background: `${item.color}22` }}
              >
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                {item.postId ? (
                  <Link href={`/post/${item.postId}`} className="font-bold text-sm leading-snug hover:text-lime transition-colors line-clamp-2">
                    {item.name}
                  </Link>
                ) : (
                  <p className="font-bold text-sm leading-snug line-clamp-2">{item.name}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span style={{ color: item.color }} className="font-bold">{item.typeLabel}</span>
                  <span>📍 {item.distanceLabel}</span>
                  <span className="truncate">{item.meta}</span>
                </p>
              </div>
              {item.joinable && (
                <button
                  type="button"
                  disabled={pending || item.joined}
                  onClick={() => handleJoin(item)}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer min-w-[40px]",
                    item.joined
                      ? "bg-good/15 text-good"
                      : "bg-lime text-lime-foreground hover:opacity-90",
                  )}
                >
                  {item.joined ? "✓" : "+"}
                </button>
              )}
            </div>
            </MotionEnter>
          ))
        )}
      </div>
    </div>
  );
}
