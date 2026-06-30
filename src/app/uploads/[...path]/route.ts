import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ path: string[] }> };

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, ctx: Ctx) {
  const { path: segments } = await ctx.params;
  if (!segments?.length) return new NextResponse("Not found", { status: 404 });

  const safe = segments.every((s) => s && !s.includes("..") && !s.includes("/"));
  if (!safe) return new NextResponse("Forbidden", { status: 403 });

  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);
  try {
    const buf = await readFile(filePath);
    const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase() ?? "";
    const type = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
