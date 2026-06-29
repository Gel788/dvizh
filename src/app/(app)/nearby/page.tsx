import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { NearbyView } from "@/components/nearby/nearby-view";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CITY_COORDS } from "@/lib/geo";
import { buildNearbyItems } from "@/lib/nearby-data";

export const dynamic = "force-dynamic";

export default async function NearbyPage() {
  const session = await getSession();
  const city = session?.city ?? "Москва";
  const coords = CITY_COORDS[city] ?? CITY_COORDS["Москва"];
  const origin = {
    lat: session?.lat ?? coords.lat,
    lng: session?.lng ?? coords.lng,
  };
  const userId = session?.id;

  const [posts, localChallenges, globalChallenges, events] = await Promise.all([
    db.post.findMany({
      where: { city },
      select: {
        id: true, title: true, content: true, type: true, lat: true, lng: true,
        author: { select: { name: true } },
      },
      take: 40,
    }),
    db.challenge.findMany({
      where: { isGlobal: false, post: { city } },
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
      where: { city, startAt: { gte: new Date() } },
      include: { _count: { select: { attendees: true } } },
      orderBy: { startAt: "asc" },
      take: 12,
    }),
  ]);

  const { local, global } = buildNearbyItems({
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
  });

  return (
    <PageShell
      title="Рядом"
      description="Движ в радиусе пешей доступности"
      icon={<MapPin className="h-6 w-6" />}
      accent="ice"
    >
      <Suspense fallback={<div className="h-[280px] animate-pulse bg-muted/40 rounded-[22px]" />}>
        <NearbyView city={city} coords={coords} localItems={local} globalItems={global} />
      </Suspense>
    </PageShell>
  );
}
