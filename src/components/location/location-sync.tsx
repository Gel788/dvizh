"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncUserLocationAction } from "@/lib/actions";

const SYNC_INTERVAL_MS = 90_000;
const MIN_MOVE_KM = 0.05;

function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function LocationSync() {
  const router = useRouter();
  const last = useRef<{ lat: number; lng: number; at: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const push = async (lat: number, lng: number, force = false) => {
      const prev = last.current;
      const now = Date.now();
      if (
        !force &&
        prev &&
        now - prev.at < SYNC_INTERVAL_MS &&
        kmBetween(prev, { lat, lng }) < MIN_MOVE_KM
      ) {
        return;
      }
      last.current = { lat, lng, at: now };
      const res = await syncUserLocationAction(lat, lng);
      if (res.ok) router.refresh();
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => void push(pos.coords.latitude, pos.coords.longitude, true),
      () => {},
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => void push(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: false, maximumAge: 120_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [router]);

  return null;
}
