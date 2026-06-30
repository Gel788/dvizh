import fs from "fs/promises";
import path from "path";
import { absoluteMediaUrl } from "@/lib/upload/media";

const MAX_BYTES = 2 * 1024 * 1024;

export async function saveAvatarFromDataUrl(userId: string, dataUrl: string): Promise<string> {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("INVALID_IMAGE");

  const ext = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await fs.mkdir(dir, { recursive: true });

  const filename = `${userId}.${ext === "jpeg" ? "jpg" : ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  return absoluteMediaUrl(`/uploads/avatars/${filename}`);
}

export function absoluteAvatarUrl(relativePath: string): string {
  const base = relativePath.split("?")[0];
  return absoluteMediaUrl(base);
}
