import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 4 * 1024 * 1024;

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

export async function saveImageBuffer(
  subdir: string,
  prefix: string,
  buffer: Buffer,
  ext: string,
): Promise<string> {
  if (buffer.length > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  const safeExt = ext === "jpeg" ? "jpg" : ext;
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${prefix}-${randomBytes(6).toString("hex")}.${safeExt}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

export async function saveImageFromDataUrl(subdir: string, prefix: string, dataUrl: string): Promise<string> {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("INVALID_IMAGE");

  const ext = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  return saveImageBuffer(subdir, prefix, buffer, ext);
}

export async function saveImageFromFile(subdir: string, prefix: string, file: File): Promise<string> {
  const type = file.type.toLowerCase();
  const extMap: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extMap[type];
  if (!ext) throw new Error("INVALID_IMAGE");

  const buffer = Buffer.from(await file.arrayBuffer());
  return saveImageBuffer(subdir, prefix, buffer, ext);
}
