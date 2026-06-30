function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://www.flroal.ru").replace(/\/$/, "");
}

export function ensureAbsoluteMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const base = siteBase();
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function normalizePostImages(images: string | null | undefined): string {
  if (!images) return "";
  return images
    .split(",")
    .map((s) => ensureAbsoluteMediaUrl(s.trim()))
    .filter(Boolean)
    .join(",");
}

export function firstPostImage(images: string | null | undefined): string | null {
  const normalized = normalizePostImages(images);
  if (!normalized) return null;
  return normalized.split(",")[0] ?? null;
}

export function absoluteMediaUrl(relativePath: string, version?: number): string {
  const base = siteBase();
  const v = version ?? Date.now();
  const sep = relativePath.includes("?") ? "&" : "?";
  const withVersion = `${relativePath}${sep}v=${v}`;
  if (!base) return withVersion;
  return `${base}${withVersion}`;
}
