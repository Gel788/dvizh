import { CITY_COORDS } from "@/lib/geo";

export async function geocodeAddress(
  address: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = [address, city, "Россия"].filter(Boolean).join(", ");
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "DvizhApp/1.0 (flroal.ru)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data.length) return null;

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export function cityCenter(city: string): { lat: number; lng: number } {
  const c = CITY_COORDS[city] ?? CITY_COORDS["Москва"];
  return { lat: c.lat, lng: c.lng };
}
