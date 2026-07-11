import { cookies, headers } from "next/headers";

async function resolveSiteOrigin(): Promise<string> {
  // SSR → свой API: localhost, не публичный URL (избегаем петли через nginx и таймаутов)
  if (process.env.INTERNAL_API_ORIGIN) {
    return process.env.INTERNAL_API_ORIGIN.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    const port = process.env.PORT ?? "3000";
    return `http://127.0.0.1:${port}`;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
}

export type V1Query = Record<string, string | number | boolean | null | undefined>;

/** Server-side fetch к `/api/v1/*` с cookie-сессией — тот же контракт, что Flutter. */
export async function v1Fetch<T>(
  path: string,
  options: { query?: V1Query; method?: string; body?: unknown } = {},
): Promise<T | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("dar_session");
  const url = new URL(`/api/v1${path.startsWith("/") ? path : `/${path}`}`, await resolveSiteOrigin());

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(session ? { Cookie: `${session.name}=${session.value}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const res = await fetch(url.toString(), init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
