import path from "path";

/** Постоянная папка загрузок (переживает деплой). На VPS: UPLOADS_DIR=/opt/dvizh/data/uploads */
export function uploadsRoot(): string {
  const custom = process.env.UPLOADS_DIR?.trim();
  if (custom) return path.resolve(custom);
  return path.join(process.cwd(), "public", "uploads");
}

export function uploadFilePath(...segments: string[]): string {
  return path.join(uploadsRoot(), ...segments);
}
