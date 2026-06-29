"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PostType } from "@prisma/client";

export type MapMarker = {
  id: string;
  title: string | null;
  content: string;
  type: PostType;
  lat: number;
  lng: number;
  district: string | null;
  emoji?: string;
  color?: string;
};

const DGIS_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY;

const mapLoading = (
  <div className="h-[min(42vh,280px)] rounded-[22px] bg-white/[0.04] animate-pulse flex items-center justify-center text-muted-foreground text-sm">
    Загрузка карты…
  </div>
);

const DgisMapInner = dynamic(() => import("./dgis-map-inner"), {
  ssr: false,
  loading: () => mapLoading,
});

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => mapLoading,
});

export function CityMap({
  markers,
  center,
  compact = true,
  onUserPosition,
  radiusM = 1500,
}: {
  markers: MapMarker[];
  center: [number, number];
  compact?: boolean;
  onUserPosition?: (pos: [number, number]) => void;
  radiusM?: number;
}) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(next);
        onUserPosition?.(next);
      },
      () => setUserPos(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, [onUserPosition]);

  const mapCenter = userPos ?? center;
  const MapComponent = DGIS_KEY ? DgisMapInner : MapInner;
  return (
    <MapComponent
      markers={markers}
      center={mapCenter}
      userPos={userPos}
      compact={compact}
      radiusM={radiusM}
    />
  );
}
