"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./city-map";

const typeColors: Record<string, string> = {
  ACTIVITY: "#D94F2B",
  CHALLENGE: "#1B6B6B",
  ANNOUNCEMENT: "#C4A035",
};

function createIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function MapInner({
  markers,
  center,
  userPos,
}: {
  markers: MapMarker[];
  center: [number, number];
  userPos: [number, number] | null;
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-[calc(100vh-12rem)] w-full rounded-2xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userPos && (
        <>
          <Marker position={userPos} icon={createIcon("#2563eb")} />
          <Circle center={userPos} radius={5000} pathOptions={{ color: "#2563eb", fillOpacity: 0.05 }} />
        </>
      )}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={createIcon(typeColors[m.type] ?? "#666")}
        >
          <Popup>
            <div className="text-sm space-y-1 min-w-[160px]">
              {m.title && <p className="font-semibold">{m.title}</p>}
              <p className="text-xs text-gray-600 line-clamp-2">{m.content}</p>
              {m.district && <p className="text-xs text-gray-500">{m.district}</p>}
              <Link href={`/post/${m.id}`} className="text-xs text-blue-600 hover:underline">
                Открыть →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
