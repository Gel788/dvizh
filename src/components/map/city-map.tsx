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
};

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-12rem)] rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">
      Загрузка карты...
    </div>
  ),
});

export function CityMap({ markers, center }: { markers: MapMarker[]; center: [number, number] }) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  return <MapInner markers={markers} center={center} userPos={userPos} />;
}
