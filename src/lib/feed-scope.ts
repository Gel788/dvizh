import { CITIES } from "@/lib/geo";

export const CONTENT_FALLBACK_CITY = "Москва";

/** Города, из которых собираем ленту и «Движ». */
export function resolveContentCities(city: string): string[] {
  const trimmed = (city || CONTENT_FALLBACK_CITY).trim();
  const set = new Set<string>([trimmed]);
  if (trimmed !== CONTENT_FALLBACK_CITY) set.add(CONTENT_FALLBACK_CITY);
  return [...set];
}

/** Посёлок/деревня из OSM — не подменяем ими город аккаунта. */
export function isObscureSettlement(city: string): boolean {
  const c = city.trim().toLowerCase();
  if (!c) return true;
  if (CITIES.some((m) => c === m.toLowerCase())) return false;
  const obscure = [
    "посёлок",
    "поселок",
    "деревня",
    "сельское",
    "станица",
    "хутор",
    "снт",
    "дп",
    "мкр.",
    "совхоз",
  ];
  if (obscure.some((k) => c.includes(k))) return true;
  return c.length > 32;
}

export function sanitizeProfileCity(
  city: string | undefined,
  currentCity: string,
): string | undefined {
  if (city == null) return undefined;
  const trimmed = city.trim();
  if (!trimmed) return undefined;
  if (isObscureSettlement(trimmed)) return currentCity;
  return trimmed;
}

/** Посты спонсоров и избранное — видны во всех городах. */
export function sponsoredOrFeaturedWhere() {
  return {
    OR: [
      { tags: { contains: "sponsored" } },
      { featuredInFeed: true },
    ],
  } as const;
}
