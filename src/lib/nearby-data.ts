import { haversineKm } from "@/lib/geo";

export type NearbyKind = "sponsor" | "event" | "challenge" | "person" | "global";

export type NearbyItem = {
  id: string;
  kind: NearbyKind;
  emoji: string;
  color: string;
  name: string;
  typeLabel: string;
  distanceKm: number | null;
  distanceLabel: string;
  meta: string;
  postId?: string;
  challengeId?: string;
  eventId?: string;
  joinable: boolean;
  joined: boolean;
  lat: number | null;
  lng: number | null;
};

export function formatDistanceKm(km: number): string {
  if (km < 0.15) return "< 150 м";
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1).replace(".", ",")} км`;
}

function distLabel(km: number | null, global = false) {
  if (global) return "весь мир";
  if (km == null) return "рядом";
  return formatDistanceKm(km);
}

function d(origin: { lat: number; lng: number }, lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null;
  return haversineKm(origin.lat, origin.lng, lat, lng);
}

const KIND_META: Record<NearbyKind, { emoji: string; color: string; label: string }> = {
  sponsor: { emoji: "☕", color: "#FFB020", label: "Спонсор" },
  event: { emoji: "🧘", color: "#2D6BFF", label: "Событие" },
  challenge: { emoji: "🧹", color: "#7C5CFF", label: "Челлендж" },
  person: { emoji: "👋", color: "#FF3D9A", label: "Человек" },
  global: { emoji: "🌍", color: "#22B07D", label: "Глобальный" },
};

export function buildNearbyItems(input: {
  origin: { lat: number; lng: number };
  posts: {
    id: string; title: string | null; content: string; type: string;
    lat: number | null; lng: number | null; author?: { name: string };
  }[];
  events: {
    id: string; title: string; startAt: Date; lat: number | null; lng: number | null;
    _count: { attendees: number };
    joined?: boolean;
  }[];
  localChallenges: {
    id: string; isBusiness: boolean; reward: string | null;
    post: { id: string; title: string | null; content: string; lat: number | null; lng: number | null };
    _count: { participants: number };
    joined: boolean;
  }[];
  globalChallenges: {
    id: string; reward: string | null;
    post: { id: string; title: string | null; content: string };
    _count: { participants: number };
    joined: boolean;
  }[];
}): { local: NearbyItem[]; global: NearbyItem[] } {
  const { origin, posts, events, localChallenges, globalChallenges } = input;
  const local: NearbyItem[] = [];

  for (const ch of localChallenges) {
    const km = d(origin, ch.post.lat, ch.post.lng);
    const kind: NearbyKind = ch.isBusiness ? "sponsor" : "challenge";
    const meta = ch.isBusiness
      ? `${ch.reward ?? "+50 XP"} · бонус`
      : `${ch._count.participants.toLocaleString("ru")} участников`;
    const m = KIND_META[kind];
    local.push({
      id: `ch-${ch.id}`,
      kind,
      emoji: m.emoji,
      color: m.color,
      name: ch.post.title ?? ch.post.content.slice(0, 60),
      typeLabel: m.label,
      distanceKm: km,
      distanceLabel: distLabel(km),
      meta,
      postId: ch.post.id,
      challengeId: ch.id,
      joinable: true,
      joined: ch.joined,
      lat: ch.post.lat,
      lng: ch.post.lng,
    });
  }

  for (const ev of events) {
    const km = d(origin, ev.lat, ev.lng);
    const m = KIND_META.event;
    const when = ev.startAt.toLocaleDateString("ru-RU", { weekday: "short", hour: "2-digit", minute: "2-digit" });
    local.push({
      id: `ev-${ev.id}`,
      kind: "event",
      emoji: m.emoji,
      color: m.color,
      name: ev.title,
      typeLabel: m.label,
      distanceKm: km,
      distanceLabel: distLabel(km),
      meta: `${ev._count.attendees} идут · ${when}`,
      eventId: ev.id,
      joinable: true,
      joined: ev.joined ?? false,
      lat: ev.lat,
      lng: ev.lng,
    });
  }

  for (const p of posts) {
    if (p.type !== "ACTIVITY" && p.type !== "ANNOUNCEMENT") continue;
    const km = d(origin, p.lat, p.lng);
    const isPerson = p.type === "ACTIVITY";
    const kind: NearbyKind = isPerson ? "person" : "event";
    const m = KIND_META[kind];
    local.push({
      id: `p-${p.id}`,
      kind,
      emoji: isPerson ? "👋" : "📣",
      color: m.color,
      name: p.title ?? p.content.slice(0, 70),
      typeLabel: isPerson ? "Человек" : "Объявление",
      distanceKm: km,
      distanceLabel: distLabel(km),
      meta: isPerson ? (p.author?.name ? `${p.author.name} рядом` : "активность") : p.content.slice(0, 80),
      postId: p.id,
      joinable: false,
      joined: false,
      lat: p.lat,
      lng: p.lng,
    });
  }

  local.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));

  const global: NearbyItem[] = globalChallenges.map((ch, i) => {
    const icons = ["📚", "💧", "🚭", "🏃", "🧘"];
    const colors = ["#7C5CFF", "#2D6BFF", "#22B07D", "#FFB020", "#FF3D9A"];
    return {
      id: `g-${ch.id}`,
      kind: "global" as const,
      emoji: icons[i % icons.length],
      color: colors[i % colors.length],
      name: ch.post.title ?? ch.post.content.slice(0, 60),
      typeLabel: "Глобальный челлендж",
      distanceKm: null,
      distanceLabel: "весь мир",
      meta: `${ch._count.participants.toLocaleString("ru")} участников${ch.reward ? ` · ${ch.reward}` : ""}`,
      postId: ch.post.id,
      challengeId: ch.id,
      joinable: true,
      joined: ch.joined,
      lat: null,
      lng: null,
    };
  });

  return { local, global };
}

export function filterNearbyItem(item: NearbyItem, mapFilter: string) {
  if (mapFilter === "Все") return true;
  if (mapFilter === "Спонсоры") return item.kind === "sponsor";
  if (mapFilter === "События") return item.kind === "event";
  if (mapFilter === "Люди") return item.kind === "person";
  return true;
}

/** Отсечь объекты дальше радиуса; без координат оставляем в конце списка */
export function applyNearbyRadius(items: NearbyItem[], radiusKm: number) {
  const withDist = items.filter((i) => i.distanceKm != null && i.distanceKm <= radiusKm);
  const noCoords = items.filter((i) => i.distanceKm == null);
  return [...withDist, ...noCoords];
}
