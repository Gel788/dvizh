export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Новосибирск",
  "Екатеринбург",
] as const;

export const MOSCOW_DISTRICTS = [
  "Арбат",
  "Басманный",
  "Замоскворечье",
  "Хамовники",
  "Тверской",
  "Пресненский",
  "Таганский",
  "Якиманка",
  "Сокол",
  "Измайлово",
] as const;

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Москва: { lat: 55.7558, lng: 37.6173 },
  "Санкт-Петербург": { lat: 59.9343, lng: 30.3351 },
  Казань: { lat: 55.7887, lng: 49.1221 },
  Новосибирск: { lat: 55.0084, lng: 82.9357 },
  Екатеринбург: { lat: 56.8389, lng: 60.6057 },
};

/** Пешая доступность — «рядом» по умолчанию */
export const DEFAULT_NEARBY_RADIUS_KM = 1.5;

export function parseCoord(value: string | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function resolveOrigin(
  session: { lat: number | null; lng: number | null; city: string } | null | undefined,
  city: string,
  overrides?: { lat?: number | null; lng?: number | null },
) {
  const fallback = CITY_COORDS[city] ?? CITY_COORDS["Москва"];
  const lat = overrides?.lat ?? session?.lat ?? fallback.lat;
  const lng = overrides?.lng ?? session?.lng ?? fallback.lng;
  const hasGps = overrides?.lat != null && overrides?.lng != null
    || (session?.lat != null && session?.lng != null);
  return { lat, lng, hasGps };
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export function formatTags(tags: string[]): string {
  return tags.join(",");
}

/** Смещение ~300–700 м для режима «только район» */
export function fuzzCoordinates(
  lat: number,
  lng: number,
  seed = "",
): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const distKm = 0.3 + (Math.abs(hash >> 8) % 400) / 1000;
  const dLat = (distKm / 111) * Math.cos(angle);
  const dLng =
    (distKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
  return { lat: lat + dLat, lng: lng + dLng };
}

export function publicCoordinates(
  lat: number | null,
  lng: number | null,
  precision: string | null | undefined,
  seed: string,
): { lat: number | null; lng: number | null } {
  if (lat == null || lng == null) return { lat, lng };
  if (precision === "exact") return { lat, lng };
  return fuzzCoordinates(lat, lng, seed);
}
