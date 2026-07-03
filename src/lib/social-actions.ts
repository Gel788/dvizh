"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DuelPeriod, MediaStatus, MediaType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createDuelRecord } from "@/lib/duel-service";
import { claimSharedGoalItem, createSharedGoalRecord, listSharedGoalsForUser } from "@/lib/shared-goal-service";
import { reserveWishlistItemRecord, createWishlistRecord, addWishlistItemRecord, updateWishlistRecord, updateWishlistItemRecord, deleteWishlistRecord, deleteWishlistItemRecord } from "@/lib/wishlist-service";
import { deleteMediaItem, updateMediaItem, copyMediaFromUser } from "@/lib/media-service";
import { sentenceCase } from "@/lib/text-format";

const VIS: Record<string, Visibility> = {
  private: "PRIVATE", friends: "FRIENDS", all: "PUBLIC",
};

const DUEL_PERIOD: Record<string, DuelPeriod> = {
  daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY",
};

const MEDIA_TYPE: Record<string, MediaType> = {
  film: "FILM", series: "SERIES", book: "BOOK", game: "GAME",
};

const MEDIA_STATUS: Record<string, MediaStatus> = {
  want: "WANT", progress: "IN_PROGRESS", done: "DONE",
};

async function me() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function createDuelAction(input: {
  title: string;
  description?: string;
  emoji?: string;
  period: string;
  visibility: string;
  friendIds: string[];
  remindersOn?: boolean;
}) {
  const session = await me();
  try {
    await createDuelRecord(session.id, {
      title: input.title,
      description: input.description,
      emoji: input.emoji,
      period: input.period,
      visibility: input.visibility,
      friendIds: input.friendIds,
      remindersOn: input.remindersOn,
    });
  } catch (e) {
    if (e instanceof Error && (e.message === "MIN_PARTICIPANTS" || e.message === "MAX_PARTICIPANTS")) {
      return;
    }
    throw e;
  }

  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
}

export async function markDuelAction(duelId: string) {
  const session = await me();
  const part = await db.duelParticipant.findUnique({
    where: { duelId_userId: { duelId, userId: session.id } },
  });
  if (!part) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const already = await db.duelMark.findFirst({
    where: { participantId: part.id, markedAt: { gte: today } },
  });
  if (already) return;

  await db.$transaction([
    db.duelMark.create({ data: { participantId: part.id } }),
    db.duelParticipant.update({
      where: { id: part.id },
      data: { streak: part.streak + 1, totalMarks: part.totalMarks + 1 },
    }),
  ]);

  revalidatePath(`/profile/${session.username}`);
}

export async function sendDuelEmojiAction(duelId: string, emoji: string) {
  const session = await me();
  await db.activity.create({
    data: {
      userId: session.id,
      type: "DUEL_MARKED",
      visibility: "FRIENDS",
      title: `${emoji} в поединке`,
      body: emoji,
      metadata: JSON.stringify({ duelId }),
    },
  });
}

export async function createSharedGoalAction(input: {
  title: string;
  items: string[];
  friendIds: string[];
  eventAt?: string | null;
}) {
  const session = await me();
  try {
    await createSharedGoalRecord(session.id, input);
  } catch (e) {
    if (e instanceof Error && (e.message === "MIN_MEMBERS" || e.message === "MIN_ITEMS")) return;
    throw e;
  }
  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
}

export async function claimGoalItemAction(itemId: string) {
  const session = await me();
  await claimSharedGoalItem(session.id, itemId);
  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
}

export async function completeGoalItemAction(itemId: string) {
  const session = await me();
  const { completeSharedGoalItemRecord } = await import("@/lib/shared-goal-service");
  await completeSharedGoalItemRecord(session.id, itemId);
  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
}

export async function createWishlistAction(input: {
  title: string;
  occasion?: string;
  eventAt?: string | null;
  visibility: string;
  items?: { title: string; price?: string; link?: string; comment?: string }[];
}) {
  const session = await me();
  await createWishlistRecord(session.id, input);
  revalidatePath(`/profile/${session.username}`);
}

export async function reserveWishlistItemAction(itemId: string) {
  const session = await me();
  const result = await reserveWishlistItemRecord(session.id, session.username, itemId);
  if ("error" in result) throw new Error(result.error);
  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
}

export async function addMediaItemAction(input: {
  type: string;
  title: string;
  status: string;
  rating?: number;
  review?: string;
  visibility: string;
}) {
  const session = await me();
  const item = await db.mediaItem.create({
    data: {
      userId: session.id,
      type: MEDIA_TYPE[input.type] ?? "FILM",
      title: sentenceCase(input.title),
      status: MEDIA_STATUS[input.status] ?? "WANT",
      rating: input.rating ?? null,
      review: input.review?.trim() ? sentenceCase(input.review) : null,
      visibility: VIS[input.visibility] ?? "PUBLIC",
    },
  });

  if (VIS[input.visibility] !== "PRIVATE") {
    await db.activity.create({
      data: {
        userId: session.id,
        type: "MEDIA_ADDED",
        visibility: VIS[input.visibility] ?? "PUBLIC",
        title: sentenceCase(input.title),
        body: input.review?.trim() ? sentenceCase(input.review) : input.type,
        metadata: JSON.stringify({ mediaId: item.id }),
      },
    });
  }

  revalidatePath(`/profile/${session.username}`);
}

export async function updateMediaItemAction(
  itemId: string,
  input: {
    title?: string;
    type?: string;
    status?: string;
    rating?: number | null;
    review?: string | null;
    visibility?: string;
    pinned?: boolean;
    coverUrl?: string | null;
  },
) {
  const session = await me();
  await updateMediaItem(session.id, itemId, input);
  revalidatePath(`/profile/${session.username}`);
}

export async function deleteMediaItemAction(itemId: string) {
  const session = await me();
  const ok = await deleteMediaItem(session.id, itemId);
  if (!ok) throw new Error("NOT_FOUND");
  revalidatePath(`/profile/${session.username}`);
}

export async function copyMediaItemAction(sourceItemId: string) {
  const session = await me();
  await copyMediaFromUser(session.id, sourceItemId);
  revalidatePath(`/profile/${session.username}`);
}

export async function addWishlistItemAction(
  listId: string,
  input: { title: string; price?: string; link?: string; comment?: string },
) {
  const session = await me();
  await addWishlistItemRecord(session.id, listId, input);
  revalidatePath(`/profile/${session.username}`);
}

export async function updateWishlistAction(
  listId: string,
  input: {
    title?: string;
    occasion?: string | null;
    eventAt?: string | null;
    visibility?: string;
  },
) {
  const session = await me();
  await updateWishlistRecord(session.id, listId, input);
  revalidatePath(`/profile/${session.username}`);
}

export async function deleteWishlistAction(listId: string) {
  const session = await me();
  await deleteWishlistRecord(session.id, listId);
  revalidatePath(`/profile/${session.username}`);
}

export async function updateWishlistItemAction(
  itemId: string,
  input: { title?: string; price?: string | null; link?: string | null; comment?: string | null },
) {
  const session = await me();
  await updateWishlistItemRecord(session.id, itemId, input);
  revalidatePath(`/profile/${session.username}`);
}

export async function deleteWishlistItemAction(itemId: string) {
  const session = await me();
  await deleteWishlistItemRecord(session.id, itemId);
  revalidatePath(`/profile/${session.username}`);
}

export async function cheerActivityAction(activityId: string) {
  const session = await me();
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.userId === session.id) return;
  await db.notification.create({
    data: {
      userId: activity.userId,
      type: "LIKE",
      title: `${session.name} поддержал`,
      body: activity.title,
      link: "/friends?view=feed",
    },
  });
}

export async function connectHealthAction(steps: number, distanceKm: number) {
  const session = await me();
  await db.userProfile.upsert({
    where: { userId: session.id },
    create: { userId: session.id, healthConnected: true, healthSteps: steps, healthDistanceKm: distanceKm },
    update: { healthConnected: true, healthSteps: steps, healthDistanceKm: distanceKm },
  });
  revalidatePath("/");
  revalidatePath(`/profile/${session.username}`);
}

export async function getFriendsForPicker(userId: string) {
  const rows = await db.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, name: true, username: true, avatar: true } },
      addressee: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addressee : r.requester));
}

export async function getSharedGoalsForUser(userId: string) {
  return listSharedGoalsForUser(userId);
}
