"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./city-map";

function createEmojiIcon(emoji: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:40px;height:48px;position:relative;filter:drop-shadow(0 4px 8px rgba(0,0,0,.45))">
      <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:17px;line-height:1">${emoji}</span>
      </div>
    </div>`,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -44],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#C8FF57;border:3px solid #fff;box-shadow:0 0 0 4px rgba(200,255,87,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [map, center, zoom]);
  return null;
}

export default function MapInner({
  markers,
  center,
  userPos,
  compact = true,
  radiusM = 1500,
}: {
  markers: MapMarker[];
  center: [number, number];
  userPos: [number, number] | null;
  compact?: boolean;
  radiusM?: number;
}) {
  const mapCenter = userPos ?? center;
  const zoom = compact ? 14 : 12;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className={compact ? "h-[min(42vh,280px)] w-full z-0" : "h-[calc(100vh-12rem)] w-full z-0"}
      scrollWheelZoom
      zoomControl={false}
    >
      <MapRecenter center={mapCenter} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {userPos && (
        <>
          <Marker position={userPos} icon={userIcon} zIndexOffset={1000} />
          <Circle
            center={userPos}
            radius={radiusM}
            pathOptions={{ color: "#C8FF57", fillColor: "#C8FF57", fillOpacity: 0.07, weight: 1.5, dashArray: "6 8" }}
          />
        </>
      )}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={createEmojiIcon(m.emoji ?? "📍", m.color ?? "#C8FF57")}
        >
          <Popup className="nearby-popup">
            <div className="text-sm space-y-1 min-w-[168px] text-foreground">
              {m.title && <p className="font-bold">{m.title}</p>}
              <p className="text-xs text-muted-foreground line-clamp-2">{m.content}</p>
              {m.district && <p className="text-[11px] text-muted-foreground">{m.district}</p>}
              <Link href={`/post/${m.id}`} className="text-xs text-lime font-bold hover:underline inline-block mt-1">
                Открыть →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
