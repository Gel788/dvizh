import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const full = searchParams.get("full") === "1";

    const [user, profileRow, profile] = await Promise.all([
      db.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          city: true,
          district: true,
          lat: true,
          lng: true,
          verified: true,
          reputation: true,
          _count: { select: { posts: true, followers: true, following: true } },
        },
      }),
      db.userProfile.findUnique({ where: { userId: session.id }, select: { mascotStage: true, xp: true, level: true } }),
      ensureProfile(session.id),
    ]);

    const mascot = (["panda", "sloth", "rabbit"] as const)[profileRow?.mascotStage ?? 0] ?? "panda";

    if (!full) {
      return jsonOk({
        user,
        mascot,
        diary: {
          xp: profile.xp,
          level: profile.level,
        },
        light: true,
      });
    }

    const { getDiaryBundle } = await import("@/lib/diary-actions");
    const diary = await getDiaryBundle(session.id);
    return jsonOk({ user, diary, mascot, light: false });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

type PatchBody = {
  name?: string;
  bio?: string;
  city?: string;
  district?: string;
  mascot?: string;
  lat?: number;
  lng?: number;
};

export async function PATCH(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<PatchBody>(request);
    if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");

    const user = await db.user.update({
      where: { id: session.id },
      data: {
        ...(body.name != null ? { name: body.name.trim() } : {}),
        ...(body.bio != null ? { bio: body.bio.trim() || null } : {}),
        ...(body.city != null ? { city: body.city.trim() || session.city } : {}),
        ...(body.district != null ? { district: body.district.trim() || null } : {}),
        ...(body.lat != null && Number.isFinite(body.lat) ? { lat: body.lat } : {}),
        ...(body.lng != null && Number.isFinite(body.lng) ? { lng: body.lng } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        city: true,
        district: true,
        lat: true,
        lng: true,
        verified: true,
        reputation: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    if (body.mascot) {
      const mascotMap: Record<string, number> = { panda: 0, sloth: 1, rabbit: 2 };
      const stage = mascotMap[body.mascot];
      if (stage != null) {
        await db.userProfile.upsert({
          where: { userId: session.id },
          create: { userId: session.id, mascotStage: stage },
          update: { mascotStage: stage },
        });
      }
    }

    const profileRow = await db.userProfile.findUnique({
      where: { userId: session.id },
      select: { mascotStage: true },
    });
    const mascot = (["panda", "sloth", "rabbit"] as const)[profileRow?.mascotStage ?? 0] ?? "panda";

    return jsonOk({ user, mascot });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
