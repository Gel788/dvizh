import { getNearbyPayload, parseNearbyQuery } from "@/lib/api/nearby-service";
import { getSessionFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api/http";
import type { NearbyItem } from "@/lib/nearby-data";

function mapNearbyItemToActivity(item: NearbyItem) {
  const type = item.kind === "challenge"
    ? "challenge"
    : item.kind === "event"
      ? "event"
      : item.kind === "person"
        ? "meetup"
        : "event";

  return {
    id: item.id,
    title: item.name,
    description: item.meta,
    type,
    scope: "nearby",
    locationTitle: item.name,
    latitude: item.lat,
    longitude: item.lng,
    distanceMeters: item.distanceKm != null ? Math.round(item.distanceKm * 1000) : null,
    startsAt: null,
    participantsCount: 0,
    requiresApproval: item.requiresApproval ?? false,
    joinRequestPending: item.joinRequestPending ?? false,
    linkedFeedPostId: item.postId ?? null,
    linkedChallengeId: item.challengeId ?? null,
    linkedEventId: item.eventId ?? null,
    joined: item.joined,
    joinable: item.joinable,
    coverImageUrl: item.imageUrl ?? null,
  };
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const payload = await getNearbyPayload(session, parseNearbyQuery(searchParams));
  const items = [...payload.local, ...payload.global].map(mapNearbyItemToActivity);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const slice = items.slice(0, limit);

  return jsonOk({
    items: slice,
    mapPins: slice.filter((a) => a.latitude != null && a.longitude != null),
    nextCursor: null,
    origin: payload.origin,
    radiusKm: payload.radiusKm,
    recommendationMeta: { source: "nearby", count: slice.length },
  });
}
