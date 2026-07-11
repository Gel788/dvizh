import type {
  AdminPreviewAuthor,
  AdminPreviewCalendarEvent,
  AdminPreviewChallenge,
  AdminPreviewClub,
  AdminPreviewDuel,
  AdminPreviewEvent,
  AdminPreviewFriendship,
  AdminPreviewJoinRequest,
  AdminPreviewMedia,
  AdminPreviewPost,
  AdminPreviewSharedGoal,
  AdminPreviewUser,
  AdminPreviewWishlist,
} from "@/lib/admin/preview-types";

export function parsePostImages(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function authorFrom(u: { name: string; username: string; avatar?: string | null }): AdminPreviewAuthor {
  return { name: u.name, username: u.username, avatar: u.avatar ?? null };
}

export function serializePostPreview(p: {
  id: string;
  type: string;
  title: string | null;
  content: string;
  city: string;
  district: string | null;
  images: string;
  tags: string;
  featuredInFeed: boolean;
  featuredBoost: number;
  hiddenFromFeed: boolean;
  createdAt: Date;
  author: { name: string; username: string; avatar?: string | null };
  _count: { likes: number; comments: number; going: number };
}): AdminPreviewPost {
  return {
    kind: "post",
    id: p.id,
    type: p.type,
    title: p.title,
    content: p.content,
    city: p.city,
    district: p.district,
    images: parsePostImages(p.images),
    tags: p.tags,
    featuredInFeed: p.featuredInFeed,
    featuredBoost: p.featuredBoost,
    hiddenFromFeed: p.hiddenFromFeed,
    createdAt: p.createdAt.toISOString(),
    author: authorFrom(p.author),
    likes: p._count.likes,
    comments: p._count.comments,
    going: p._count.going,
  };
}

export function serializeUserPreview(u: {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  coverImage: string | null;
  bio: string | null;
  city: string;
  district: string | null;
  verified: boolean;
  reputation: number;
  role: string;
  createdAt: Date;
  profile: { xp: number; level: number } | null;
  _count: { posts: number; followers: number; following: number };
}): AdminPreviewUser {
  return {
    kind: "user",
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    avatar: u.avatar,
    coverImage: u.coverImage,
    bio: u.bio,
    city: u.city,
    district: u.district,
    verified: u.verified,
    reputation: u.reputation,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    xp: u.profile?.xp ?? null,
    level: u.profile?.level ?? null,
    posts: u._count.posts,
    followers: u._count.followers,
    following: u._count.following,
  };
}

export function serializeMediaPreview(item: {
  id: string;
  type: string;
  title: string;
  status: string;
  rating: number | null;
  review: string | null;
  coverUrl: string | null;
  pinned: boolean;
  visibility: string;
  createdAt: Date;
  user: { name: string; username: string; avatar?: string | null };
}): AdminPreviewMedia {
  return {
    kind: "media",
    id: item.id,
    type: item.type,
    title: item.title,
    status: item.status,
    rating: item.rating,
    review: item.review,
    coverUrl: item.coverUrl,
    pinned: item.pinned,
    visibility: item.visibility,
    createdAt: item.createdAt.toISOString(),
    author: authorFrom(item.user),
  };
}

export function serializeWishlistPreview(list: {
  id: string;
  title: string;
  occasion: string | null;
  visibility: string;
  surpriseMode: boolean;
  shareToken: string | null;
  createdAt: Date;
  user: { name: string; username: string; avatar?: string | null };
  items: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: string | null;
    reserved: boolean;
    reservationStatus: string | null;
  }[];
}): AdminPreviewWishlist {
  return {
    kind: "wishlist",
    id: list.id,
    title: list.title,
    occasion: list.occasion,
    visibility: list.visibility,
    surpriseMode: list.surpriseMode,
    shareToken: list.shareToken,
    createdAt: list.createdAt.toISOString(),
    author: authorFrom(list.user),
    items: list.items.map((i) => ({
      id: i.id,
      title: i.title,
      imageUrl: i.imageUrl,
      price: i.price,
      reserved: i.reserved,
      reservationStatus: i.reservationStatus,
    })),
  };
}

export function serializeDuelPreview(d: {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  visibility: string;
  period: string;
  createdAt: Date;
  creator: { name: string; username: string; avatar?: string | null };
  _count: { participants: number };
}): AdminPreviewDuel {
  return {
    kind: "duel",
    id: d.id,
    title: d.title,
    description: d.description,
    emoji: d.emoji,
    visibility: d.visibility,
    period: d.period,
    participants: d._count.participants,
    createdAt: d.createdAt.toISOString(),
    author: authorFrom(d.creator),
  };
}

export function serializeSharedGoalPreview(g: {
  id: string;
  title: string;
  eventAt: Date | null;
  createdAt: Date;
  creator: { name: string; username: string; avatar?: string | null };
  _count: { members: number; items: number };
}): AdminPreviewSharedGoal {
  return {
    kind: "sharedGoal",
    id: g.id,
    title: g.title,
    description: null,
    eventAt: g.eventAt?.toISOString() ?? null,
    members: g._count.members,
    items: g._count.items,
    createdAt: g.createdAt.toISOString(),
    author: authorFrom(g.creator),
  };
}

export function serializeFriendshipPreview(f: {
  id: string;
  status: string;
  createdAt: Date;
  requester: { name: string; username: string; avatar?: string | null };
  addressee: { name: string; username: string; avatar?: string | null };
}): AdminPreviewFriendship {
  return {
    kind: "friendship",
    id: f.id,
    requester: authorFrom(f.requester),
    addressee: authorFrom(f.addressee),
    status: f.status,
    createdAt: f.createdAt.toISOString(),
  };
}

export function serializeJoinRequestPreview(r: {
  id: string;
  activityKind: string;
  activityId: string;
  status: string;
  createdAt: Date;
  user: { name: string; username: string; avatar?: string | null };
}, activityTitle?: string | null): AdminPreviewJoinRequest {
  return {
    kind: "joinRequest",
    id: r.id,
    activityKind: r.activityKind,
    activityId: r.activityId,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    user: authorFrom(r.user),
    activityTitle: activityTitle ?? null,
  };
}

export function serializeEventPreview(e: {
  id: string;
  title: string;
  description: string;
  city: string;
  district: string | null;
  coverImage: string | null;
  startAt: Date;
  endAt: Date | null;
  organizer: { name: string; username: string; avatar?: string | null };
  club: { name: string } | null;
  _count: { attendees: number };
}): AdminPreviewEvent {
  return {
    kind: "event",
    id: e.id,
    title: e.title,
    description: e.description,
    city: e.city,
    district: e.district,
    coverImage: e.coverImage,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt?.toISOString() ?? null,
    attendees: e._count.attendees,
    clubName: e.club?.name ?? null,
    author: authorFrom(e.organizer),
  };
}

export function serializeCalendarEventPreview(ev: {
  id: string;
  title: string;
  note: string | null;
  eventType: string;
  visibility: string;
  sourceKind: string | null;
  sourceId: string | null;
  eventDate: Date;
  user: { name: string; username: string; avatar?: string | null };
}): AdminPreviewCalendarEvent {
  return {
    kind: "calendarEvent",
    id: ev.id,
    title: ev.title,
    note: ev.note,
    eventType: ev.eventType,
    visibility: ev.visibility,
    sourceKind: ev.sourceKind,
    sourceId: ev.sourceId,
    eventDate: ev.eventDate.toISOString(),
    author: authorFrom(ev.user),
  };
}

export function serializeChallengePreview(c: {
  id: string;
  goalCount: number;
  deadline: Date | null;
  rules: string | null;
  isBusiness: boolean;
  isSeasonal: boolean;
  isGlobal: boolean;
  post: {
    id: string;
    title: string | null;
    content: string;
    city: string;
    author: { name: string; username: string; avatar?: string | null };
  };
  _count: { participants: number; reports: number };
}): AdminPreviewChallenge {
  const flags: string[] = [];
  if (c.isBusiness) flags.push("business");
  if (c.isSeasonal) flags.push("seasonal");
  if (c.isGlobal) flags.push("global");
  return {
    kind: "challenge",
    id: c.id,
    postId: c.post.id,
    title: c.post.title ?? c.post.content.slice(0, 80),
    content: c.post.content,
    city: c.post.city,
    goalCount: c.goalCount,
    deadline: c.deadline?.toISOString() ?? null,
    rules: c.rules,
    participants: c._count.participants,
    reports: c._count.reports,
    flags,
    author: authorFrom(c.post.author),
  };
}

export function serializeClubPreview(c: {
  id: string;
  name: string;
  description: string;
  city: string;
  coverImage: string | null;
  isPrivate: boolean;
  creator: { name: string; username: string; avatar?: string | null };
  _count: { members: number; events: number };
}): AdminPreviewClub {
  return {
    kind: "club",
    id: c.id,
    name: c.name,
    description: c.description,
    city: c.city,
    coverImage: c.coverImage,
    isPrivate: c.isPrivate,
    members: c._count.members,
    events: c._count.events,
    author: authorFrom(c.creator),
  };
}
