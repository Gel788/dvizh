import fs from "fs/promises";
import path from "path";
import { absoluteMediaUrl } from "@/lib/media-url";
import { uploadFilePath } from "@/lib/upload/paths";

const MAX_BYTES = 4 * 1024 * 1024;

export async function saveCoverFromDataUrl(userId: string, dataUrl: string): Promise<string> {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("INVALID_IMAGE");

  const ext = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  const dir = uploadFilePath("covers");
  await fs.mkdir(dir, { recursive: true });

  const filename = `${userId}.${ext === "jpeg" ? "jpg" : ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  return absoluteMediaUrl(`/uploads/covers/${filename}`);
}
