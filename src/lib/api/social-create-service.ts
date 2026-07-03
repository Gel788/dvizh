import type { DuelPeriod, MediaStatus, MediaType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { createDuelRecord } from "@/lib/duel-service";
import { createSharedGoalRecord } from "@/lib/shared-goal-service";
import { sentenceCase } from "@/lib/text-format";

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
    remindersOn?: boolean;
  },
) {
  try {
    const duel = await createDuelRecord(session.id, input);
    return { duel };
  } catch (e) {
    if (e instanceof Error && e.message === "MIN_PARTICIPANTS") {
      return { error: "MIN_PARTICIPANTS" as const };
    }
    if (e instanceof Error && e.message === "MAX_PARTICIPANTS") {
      return { error: "MAX_PARTICIPANTS" as const };
    }
    throw e;
  }
}

export async function createSharedGoal(
  session: SessionUser,
  input: { title: string; items: string[]; friendIds: string[]; eventAt?: string | null },
) {
  try {
    const goal = await createSharedGoalRecord(session.id, input);
    return { goal };
  } catch (e) {
    if (e instanceof Error && e.message === "MIN_MEMBERS") {
      return { error: "MIN_MEMBERS" as const };
    }
    if (e instanceof Error && e.message === "MIN_ITEMS") {
      return { error: "MIN_ITEMS" as const };
    }
    throw e;
  }
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
      title: sentenceCase(input.title),
      status: MEDIA_STATUS[input.status ?? "want"] ?? "WANT",
      rating: input.rating ?? null,
      review: input.review?.trim() ? sentenceCase(input.review) : null,
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
