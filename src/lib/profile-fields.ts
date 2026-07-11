import { presentUserMedia } from "@/lib/media-url";

export function parseInterestsJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v).trim()).filter(Boolean);
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export function serializeInterests(interests: string[] | undefined): string | null {
  if (!interests?.length) return null;
  const clean = interests.map((s) => s.trim()).filter(Boolean);
  return clean.length ? JSON.stringify(clean) : null;
}

export function presentProfileUser<T extends {
  avatar?: string | null;
  coverImage?: string | null;
  interests?: string | null;
}>(user: T) {
  const withMedia = presentUserMedia(user);
  return {
    ...withMedia,
    interests: parseInterestsJson(user.interests),
  };
}

const PROFILE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  username: true,
  avatar: true,
  coverImage: true,
  bio: true,
  city: true,
  district: true,
  telegram: true,
  vk: true,
  youtube: true,
  website: true,
  interests: true,
  lat: true,
  lng: true,
  verified: true,
  reputation: true,
  _count: { select: { posts: true, followers: true, following: true } },
} as const;

export { PROFILE_USER_SELECT };
