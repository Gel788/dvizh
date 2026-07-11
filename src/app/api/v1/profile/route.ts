import { sanitizeProfileCity } from "@/lib/feed-scope";
import { ensureProfile, getDiaryBundle } from "@/lib/diary-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { db } from "@/lib/db";
import {
  parseInterestsJson,
  presentProfileUser,
  PROFILE_USER_SELECT,
  serializeInterests,
} from "@/lib/profile-fields";
function visFromEnum(v: string): "private" | "friends" | "all" {
  if (v === "PUBLIC") return "all";
  if (v === "FRIENDS") return "friends";
  return "private";
}

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const full = searchParams.get("full") === "1";

    const [user, profileRow, profile, privacyRow] = await Promise.all([
      db.user.findUnique({
        where: { id: session.id },
        select: PROFILE_USER_SELECT,
      }),
      db.userProfile.findUnique({ where: { userId: session.id }, select: { mascotStage: true, xp: true, level: true } }),
      ensureProfile(session.id),
      db.privacySettings.findUnique({ where: { userId: session.id } }),
    ]);

    const mascot = (["panda", "sloth", "rabbit"] as const)[profileRow?.mascotStage ?? 0] ?? "panda";
    const presented = user ? presentProfileUser(user) : null;

    if (!full) {
      return jsonOk({
        user: presented,
        mascot,
        privacy: privacyRow
          ? {
              profileInSearch: privacyRow.profileInSearch,
              showLevel: privacyRow.showLevel,
              locationPrecision: privacyRow.locationPrecision,
              defaultDiary: visFromEnum(privacyRow.defaultDiary),
              defaultWishlist: visFromEnum(privacyRow.defaultWishlist),
              defaultMedia: visFromEnum(privacyRow.defaultMedia),
            }
          : null,
        diary: {
          xp: profile.xp,
          level: profile.level,
        },
        light: true,
      });
    }

    const diary = await getDiaryBundle(session.id);
    return jsonOk({ user: presented, diary, mascot, light: false });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

type PatchBody = {
  name?: string;
  bio?: string;
  city?: string;
  district?: string;
  telegram?: string;
  vk?: string;
  youtube?: string;
  website?: string;
  interests?: string[] | string;
  mascot?: string;
  lat?: number;
  lng?: number;
  avatar?: string;
  coverImage?: string;
};

export async function PATCH(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<PatchBody>(request);
    if (!body) return jsonError("Некорректный JSON", 400, "INVALID_JSON");

    let interestsValue: string | null | undefined;
    if (body.interests != null) {
      if (Array.isArray(body.interests)) {
        interestsValue = serializeInterests(body.interests);
      } else if (typeof body.interests === "string") {
        interestsValue = serializeInterests(parseInterestsJson(body.interests));
      } else {
        interestsValue = null;
      }
    }

    const user = await db.user.update({
      where: { id: session.id },
      data: {
        ...(body.name != null ? { name: body.name.trim() } : {}),
        ...(body.bio != null ? { bio: body.bio.trim() || null } : {}),
        ...(body.city != null
          ? { city: sanitizeProfileCity(body.city, session.city) ?? session.city }
          : {}),
        ...(body.district != null ? { district: body.district.trim() || null } : {}),
        ...(body.telegram != null ? { telegram: body.telegram.trim() || null } : {}),
        ...(body.vk != null ? { vk: body.vk.trim() || null } : {}),
        ...(body.youtube != null ? { youtube: body.youtube.trim() || null } : {}),
        ...(body.website != null ? { website: body.website.trim() || null } : {}),
        ...(interestsValue !== undefined ? { interests: interestsValue } : {}),
        ...(body.lat != null && Number.isFinite(body.lat) ? { lat: body.lat } : {}),
        ...(body.lng != null && Number.isFinite(body.lng) ? { lng: body.lng } : {}),
        ...(body.avatar != null ? { avatar: body.avatar.trim() || null } : {}),
        ...(body.coverImage != null ? { coverImage: body.coverImage.trim() || null } : {}),
      },
      select: PROFILE_USER_SELECT,
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

    return jsonOk({ user: presentProfileUser(user), mascot });
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
