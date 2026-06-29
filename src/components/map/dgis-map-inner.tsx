"use client";

import { useEffect, useRef, useState } from "react";
import { load } from "@2gis/mapgl";
import type { Map } from "@2gis/mapgl/types";
import type { MapMarker } from "./city-map";

const API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY;

function pinHtml(emoji: string, color: string, href: string) {
  return `<a href="${href}" style="display:block;text-decoration:none" aria-label="Открыть на карте">
    <div style="width:40px;height:48px;position:relative;filter:drop-shadow(0 4px 8px rgba(0,0,0,.45))">
      <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:17px;line-height:1">${emoji}</span>
      </div>
    </div>
  </a>`;
}

const userPinHtml = `<div style="width:18px;height:18px;border-radius:50%;background:#C8FF57;border:3px solid #fff;box-shadow:0 0 0 4px rgba(200,255,87,.35)"></div>`;

type MapGlModule = Awaited<ReturnType<typeof load>>;

export default function DgisMapInner({
  markers,
  center,
  userPos,
  compact = true,
}: {
  markers: MapMarker[];
  center: [number, number];
  userPos: [number, number] | null;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const mapglRef = useRef<MapGlModule | null>(null);
  const overlayRef = useRef<Array<{ destroy: () => void }>>([]);
  const [ready, setReady] = useState(false);

  const mapCenter = userPos ?? center;
  const zoom = compact ? 14 : 12;
  const heightClass = compact ? "h-[min(42vh,280px)]" : "h-[calc(100vh-12rem)]";

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !API_KEY) return;

    let cancelled = false;

    load()
      .then((mapgl) => {
        if (cancelled) return;
        mapglRef.current = mapgl;
        const [lat, lng] = mapCenter;
        const map = new mapgl.Map(el, {
          center: [lng, lat],
          zoom,
          key: API_KEY,
          zoomControl: false,
          trafficControl: false,
          scaleControl: false,
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
      overlayRef.current.forEach((o) => o.destroy());
      overlayRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
      mapglRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const [lat, lng] = mapCenter;
    map.setCenter([lng, lat]);
  }, [mapCenter, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const mapgl = mapglRef.current;
    if (!map || !mapgl || !ready) return;

    overlayRef.current.forEach((o) => o.destroy());
    overlayRef.current = [];

    if (userPos) {
      const [lat, lng] = userPos;
      const userMarker = new mapgl.HtmlMarker(map, {
        coordinates: [lng, lat],
        html: userPinHtml,
        anchor: [9, 9],
        zIndex: 1000,
        interactive: false,
      });
      const circle = new mapgl.Circle(map, {
        coordinates: [lng, lat],
        radius: 1500,
        color: "#c8ff5712",
        strokeColor: "#c8ff57",
        strokeWidth: 1.5,
        zIndex: 1,
      });
      overlayRef.current.push(userMarker, circle);
    }

    markers.forEach((m) => {
      const marker = new mapgl.HtmlMarker(map, {
        coordinates: [m.lng, m.lat],
        html: pinHtml(m.emoji ?? "📍", m.color ?? "#C8FF57", `/post/${m.id}`),
        anchor: [20, 48],
        zIndex: 10,
        interactive: true,
      });
      overlayRef.current.push(marker);
    });
  }, [markers, userPos, ready]);

  if (!API_KEY) return null;

  return (
    <div
      ref={containerRef}
      className={`${heightClass} w-full rounded-[22px] overflow-hidden [&_.mapgl-copyright]:!text-[10px] [&_.mapgl-copyright]:!opacity-60`}
    />
  );
}
