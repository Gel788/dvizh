import type { DuelPeriod, MediaStatus, MediaType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

const VIS: Record<string, Visibility> = {
  private: "PRIVATE",
  friends: "FRIENDS",
  all: "PUBLIC",
};

const DUEL_PERIOD: Record<string, DuelPeriod> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

const MEDIA_TYPE: Record<string, MediaType> = {
  film: "FILM",
  series: "SERIES",
  book: "BOOK",
  game: "GAME",
};

const MEDIA_STATUS: Record<string, MediaStatus> = {
  want: "WANT",
  progress: "IN_PROGRESS",
  done: "DONE",
};

export async function createDuel(
  session: SessionUser,
  input: {
    title: string;
    description?: string;
    emoji?: string;
    period?: string;
    visibility?: string;
    friendIds: string[];
  },
) {
  const ids = [...new Set([session.id, ...input.friendIds])];
  const duel = await db.duel.create({
    data: {
      creatorId: session.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      emoji: input.emoji || "⚔️",
      period: DUEL_PERIOD[input.period ?? "daily"] ?? "DAILY",
      visibility: VIS[input.visibility ?? "friends"] ?? "FRIENDS",
      participants: { create: ids.map((userId) => ({ userId })) },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, username: true } } } },
    },
  });
  return { duel };
}

export async function createSharedGoal(
  session: SessionUser,
  input: { title: string; items: string[]; friendIds: string[] },
) {
  const memberIds = [...new Set([session.id, ...input.friendIds])];
  const goal = await db.sharedGoal.create({
    data: {
      creatorId: session.id,
      title: input.title.trim(),
      members: { create: memberIds.map((userId) => ({ userId })) },
      items: {
        create: input.items.filter(Boolean).map((title, sortOrder) => ({
          title: title.trim(),
          sortOrder,
        })),
      },
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      members: { include: { user: { select: { name: true, username: true } } } },
    },
  });
  return { goal };
}

export async function addMediaItem(
  session: SessionUser,
  input: {
    type?: string;
    title: string;
    status?: string;
    rating?: number;
    review?: string;
    coverUrl?: string;
    pinned?: boolean;
    visibility?: string;
  },
) {
  if (input.pinned) {
    await db.mediaItem.updateMany({
      where: { userId: session.id, pinned: true },
      data: { pinned: false },
    });
  }
  const item = await db.mediaItem.create({
    data: {
      userId: session.id,
      type: MEDIA_TYPE[input.type ?? "film"] ?? "FILM",
      title: input.title.trim(),
      status: MEDIA_STATUS[input.status ?? "want"] ?? "WANT",
      rating: input.rating ?? null,
      review: input.review?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      pinned: input.pinned ?? false,
      visibility: VIS[input.visibility ?? "all"] ?? "PUBLIC",
    },
  });
  return { item };
}

export async function pinMediaItem(session: SessionUser, itemId: string, pinned: boolean) {
  const item = await db.mediaItem.findFirst({ where: { id: itemId, userId: session.id } });
  if (!item) return { error: "NOT_FOUND" as const };
  if (pinned) {
    await db.mediaItem.updateMany({
      where: { userId: session.id, pinned: true },
      data: { pinned: false },
    });
  }
  const updated = await db.mediaItem.update({
    where: { id: itemId },
    data: { pinned },
  });
  return { item: updated };
}

export async function listFriendsForPicker(userId: string) {
  const rows = await db.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, name: true, username: true, avatar: true } },
      addressee: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addressee : r.requester));
}
