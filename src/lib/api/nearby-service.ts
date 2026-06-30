import { db } from "@/lib/db";
import {
  DEFAULT_NEARBY_RADIUS_KM,
  parseCoord,
  publicCoordinates,
  resolveOrigin,
} from "@/lib/geo";
import { buildNearbyItems } from "@/lib/nearby-data";
import type { SessionUser } from "@/lib/auth";

export type NearbyOptions = {
  city?: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  district?: string;
};

export async function getNearbyPayload(
  session: SessionUser | null,
  options: NearbyOptions = {},
) {
  const resolvedCity = options.city ?? session?.city ?? "Москва";
  const origin = resolveOrigin(session, resolvedCity, {
    lat: options.lat,
    lng: options.lng,
  });
  const radiusKm = options.radiusKm ?? DEFAULT_NEARBY_RADIUS_KM;
  const userId = session?.id;
  const district = options.district ?? session?.district ?? undefined;

  const postWhere = district
    ? {
        city: resolvedCity,
        hiddenFromFeed: false,
        OR: [
          { district },
          { tags: { contains: "sponsored" } },
          { featuredInFeed: true },
        ],
      }
    : {
        city: resolvedCity,
        hiddenFromFeed: false,
      };

  const [posts, localChallenges, globalChallenges, events] = await Promise.all([
    db.post.findMany({
      where: postWhere,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        lat: true,
        lng: true,
        district: true,
        tags: true,
        images: true,
        featuredInFeed: true,
        contactInfo: true,
        author: {
          select: {
            id: true,
            name: true,
            privacySettings: { select: { locationPrecision: true } },
          },
        },
      },
      orderBy: [{ featuredInFeed: "desc" }, { createdAt: "desc" }],
      take: 80,
    }),
    db.challenge.findMany({
      where: {
        isGlobal: false,
        post: { city: resolvedCity, ...(district ? { district } : {}) },
      },
      include: {
        post: { select: { id: true, title: true, content: true, lat: true, lng: true, district: true } },
        _count: { select: { participants: true } },
        participants: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { participants: { _count: "desc" } },
      take: 20,
    }),
    db.challenge.findMany({
      where: { isGlobal: true },
      include: {
        post: { select: { id: true, title: true, content: true } },
        _count: { select: { participants: true } },
        participants: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { participants: { _count: "desc" } },
      take: 12,
    }),
    db.event.findMany({
      where: {
        city: resolvedCity,
        startAt: { gte: new Date() },
        ...(district ? { district } : {}),
      },
      include: {
        _count: { select: { attendees: true } },
        attendees: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { startAt: "asc" },
      take: 16,
    }),
  ]);

  const { local, global } = buildNearbyItems({
    origin,
    posts,
    events: events.map((ev) => ({
      ...ev,
      joined: Array.isArray(ev.attendees) ? ev.attendees.length > 0 : false,
    })),
    localChallenges: localChallenges.map((ch) => ({
      ...ch,
      joined: Array.isArray(ch.participants) ? ch.participants.length > 0 : false,
    })),
    globalChallenges: globalChallenges.map((ch) => ({
      ...ch,
      joined: Array.isArray(ch.participants) ? ch.participants.length > 0 : false,
    })),
  });

  const precisionByPost = new Map(
    posts.map((p) => [
      p.id,
      {
        lat: p.lat,
        lng: p.lng,
        precision: p.author?.privacySettings?.locationPrecision,
        seed: p.author?.id ?? p.id,
      },
    ]),
  );

  const localPublic = local.map((item) => {
    if (item.kind !== "person" || !item.postId) return item;
    const src = precisionByPost.get(item.postId);
    if (!src?.lat || !src.lng) return item;
    const pub = publicCoordinates(src.lat, src.lng, src.precision, src.seed);
    return { ...item, lat: pub.lat, lng: pub.lng };
  });

  return {
    city: resolvedCity,
    district: district ?? null,
    origin: { lat: origin.lat, lng: origin.lng },
    radiusKm,
    hasGps: origin.hasGps,
    local: localPublic,
    global,
  };
}

export function parseNearbyQuery(searchParams: URLSearchParams): NearbyOptions {
  return {
    city: searchParams.get("city") ?? undefined,
    lat: parseCoord(searchParams.get("lat")),
    lng: parseCoord(searchParams.get("lng")),
    radiusKm: parseCoord(searchParams.get("radiusKm") ?? searchParams.get("radius"))
      ?? DEFAULT_NEARBY_RADIUS_KM,
    district: searchParams.get("district") ?? undefined,
  };
}
