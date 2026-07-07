import { ensureAbsoluteMediaUrl } from "@/lib/media-url";

/** Бренд push-уведомлений ДВИЖ */
export const PUSH_BRAND = {
  /** Подзаголовок под title на iOS */
  subtitle: "ДВИЖ",
  /** Android accent color */
  color: "#C8FF57",
  /** Канал Android */
  channelId: "dvizh_push",
  /** Дефолтный баннер для rich push (HTTPS) */
  defaultImagePath: "/brand/push-banner.png",
} as const;

export function resolvePushImageUrl(imageUrl?: string | null, useDefault = true): string | undefined {
  const raw = imageUrl?.trim() || (useDefault ? PUSH_BRAND.defaultImagePath : "");
  const abs = ensureAbsoluteMediaUrl(raw);
  return abs || undefined;
}

export function formatPushTitle(title: string): string {
  const t = title.trim();
  if (!t) return PUSH_BRAND.subtitle;
  if (t.toLowerCase().startsWith("движ") || t.toLowerCase().startsWith("двж")) return t;
  return t;
}
