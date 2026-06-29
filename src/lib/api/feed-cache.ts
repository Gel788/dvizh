const store = new Map<string, { data: unknown; expires: number }>();

const DEFAULT_TTL_MS = 60_000;

export function getCached<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit || Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.data as T;
}

export function setCached(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateFeedCache(city?: string) {
  if (!city) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(`curated:${city}:`)) store.delete(key);
  }
}
