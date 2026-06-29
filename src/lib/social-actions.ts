"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DuelPeriod, MediaStatus, MediaType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
}) {
  const session = await me();
  const ids = [...new Set([session.id, ...input.friendIds])];

  await db.duel.create({
    data: {
      creatorId: session.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      emoji: input.emoji || "⚔️",
      period: DUEL_PERIOD[input.period] ?? "DAILY",
      visibility: VIS[input.visibility] ?? "PRIVATE",
      participants: { create: ids.map((userId) => ({ userId })) },
    },
  });

  revalidatePath(`/profile/${session.username}`);
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

export async function createSharedGoalAction(input: { title: string; items: string[]; friendIds: string[] }) {
  const session = await me();
  const memberIds = [...new Set([session.id, ...input.friendIds])];

  await db.sharedGoal.create({
    data: {
      creatorId: session.id,
      title: input.title.trim(),
      members: { create: memberIds.map((userId) => ({ userId })) },
      items: {
        create: input.items.filter(Boolean).map((title, sortOrder) => ({ title: title.trim(), sortOrder })),
      },
    },
  });

  revalidatePath(`/profile/${session.username}`);
}

export async function claimGoalItemAction(itemId: string) {
  const session = await me();
  await db.sharedGoalItem.update({
    where: { id: itemId },
    data: { assigneeId: session.id },
  });
  revalidatePath(`/profile/${session.username}`);
}

export async function completeGoalItemAction(itemId: string) {
  const session = await me();
  await db.sharedGoalItem.update({
    where: { id: itemId },
    data: { done: true, assigneeId: session.id },
  });
  revalidatePath(`/profile/${session.username}`);
}

export async function createWishlistAction(input: { title: string; occasion?: string; visibility: string }) {
  const session = await me();
  await db.wishlist.create({
    data: {
      userId: session.id,
      title: input.title.trim(),
      occasion: input.occasion?.trim() || null,
      visibility: VIS[input.visibility] ?? "FRIENDS",
    },
  });
  revalidatePath(`/profile/${session.username}`);
}

export async function reserveWishlistItemAction(itemId: string) {
  const session = await me();
  await db.wishlistItem.update({
    where: { id: itemId },
    data: { reserved: true, reservedBy: session.username },
  });
  revalidatePath(`/profile/${session.username}`);
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
  await db.mediaItem.create({
    data: {
      userId: session.id,
      type: MEDIA_TYPE[input.type] ?? "FILM",
      title: input.title.trim(),
      status: MEDIA_STATUS[input.status] ?? "WANT",
      rating: input.rating ?? null,
      review: input.review?.trim() || null,
      visibility: VIS[input.visibility] ?? "PUBLIC",
    },
  });
  revalidatePath(`/profile/${session.username}`);
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
  return db.sharedGoal.findMany({
    where: { members: { some: { userId } } },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      members: { include: { user: { select: { name: true, username: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}
