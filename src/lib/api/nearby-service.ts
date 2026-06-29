import { db } from "@/lib/db";
import { CITY_COORDS } from "@/lib/geo";
import { buildNearbyItems } from "@/lib/nearby-data";
import type { SessionUser } from "@/lib/auth";

export async function getNearbyPayload(session: SessionUser | null, city?: string) {
  const resolvedCity = city ?? session?.city ?? "Москва";
  const coords = CITY_COORDS[resolvedCity] ?? CITY_COORDS["Москва"];
  const origin = {
    lat: session?.lat ?? coords.lat,
    lng: session?.lng ?? coords.lng,
  };
  const userId = session?.id;

  const [posts, localChallenges, globalChallenges, events] = await Promise.all([
    db.post.findMany({
      where: { city: resolvedCity },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        lat: true,
        lng: true,
        author: { select: { name: true } },
      },
      take: 40,
    }),
    db.challenge.findMany({
      where: { isGlobal: false, post: { city: resolvedCity } },
      include: {
        post: { select: { id: true, title: true, content: true, lat: true, lng: true } },
        _count: { select: { participants: true } },
        participants: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { participants: { _count: "desc" } },
      take: 16,
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
      where: { city: resolvedCity, startAt: { gte: new Date() } },
      include: { _count: { select: { attendees: true } } },
      orderBy: { startAt: "asc" },
      take: 12,
    }),
  ]);

  return {
    city: resolvedCity,
    origin,
    ...buildNearbyItems({
      origin,
      posts,
      events,
      localChallenges: localChallenges.map((ch) => ({
        ...ch,
        joined: Array.isArray(ch.participants) ? ch.participants.length > 0 : false,
      })),
      globalChallenges: globalChallenges.map((ch) => ({
        ...ch,
        joined: Array.isArray(ch.participants) ? ch.participants.length > 0 : false,
      })),
    }),
  };
}
