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

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export function formatTags(tags: string[]): string {
  return tags.join(",");
}
