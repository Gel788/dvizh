import type { MediaStatus, MediaType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";
import { sentenceCase } from "@/lib/text-format";

const MEDIA_TYPE: Record<string, MediaType> = {
  film: "FILM", series: "SERIES", book: "BOOK", game: "GAME",
};

const MEDIA_STATUS: Record<string, MediaStatus> = {
  want: "WANT", progress: "IN_PROGRESS", done: "DONE",
};

const VIS: Record<string, Visibility> = {
  private: "PRIVATE", friends: "FRIENDS", all: "PUBLIC", public: "PUBLIC",
};

export async function listMediaForUser(userId: string) {
  return db.mediaItem.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
}

async function canViewUserContent(viewerId: string, ownerId: string) {
  if (viewerId === ownerId) return { isOwner: true, isFriend: true };
  const row = await db.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: ownerId },
        { requesterId: ownerId, addresseeId: viewerId },
      ],
    },
  });
  return { isOwner: false, isFriend: !!row };
}

export async function listMediaForViewer(ownerId: string, viewerId: string) {
  const { isOwner, isFriend } = await canViewUserContent(viewerId, ownerId);
  if (!isOwner && !isFriend) {
    return db.mediaItem.findMany({
      where: { userId: ownerId, visibility: "PUBLIC" },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  }
  if (isOwner) return listMediaForUser(ownerId);
  return db.mediaItem.findMany({
    where: { userId: ownerId, visibility: { in: ["FRIENDS", "PUBLIC"] } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function updateMediaItem(
  userId: string,
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
  const item = await db.mediaItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return null;

  const status = input.status ? MEDIA_STATUS[input.status] ?? item.status : item.status;
  const updated = await db.mediaItem.update({
    where: { id: itemId },
    data: {
      title: input.title !== undefined ? sentenceCase(input.title) : item.title,
      type: input.type ? (MEDIA_TYPE[input.type] ?? item.type) : item.type,
      status,
      rating: input.rating !== undefined ? input.rating : item.rating,
      review: input.review !== undefined ? (input.review?.trim() ? sentenceCase(input.review) : null) : item.review,
      visibility: input.visibility ? (VIS[input.visibility] ?? item.visibility) : item.visibility,
      pinned: input.pinned ?? item.pinned,
      coverUrl: input.coverUrl !== undefined ? input.coverUrl : item.coverUrl,
    },
  });

  if (status === "DONE" && item.status !== "DONE" && updated.visibility !== "PRIVATE") {
    await db.activity.create({
      data: {
        userId,
        type: "MEDIA_ADDED",
        visibility: updated.visibility,
        title: updated.title,
        body: updated.review?.trim() || `оценка ${updated.rating ?? "—"}`,
        metadata: JSON.stringify({ mediaId: updated.id, kind: "finished" }),
      },
    });
  }

  return updated;
}

export async function deleteMediaItem(userId: string, itemId: string) {
  const item = await db.mediaItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return false;
  await db.mediaItem.delete({ where: { id: itemId } });
  return true;
}

export async function copyMediaFromUser(viewerId: string, sourceItemId: string) {
  const source = await db.mediaItem.findUnique({ where: { id: sourceItemId } });
  if (!source || source.visibility !== "PUBLIC" || source.userId === viewerId) return null;

  const exists = await db.mediaItem.findFirst({
    where: { userId: viewerId, title: source.title, type: source.type },
  });
  if (exists) return exists;

  return db.mediaItem.create({
    data: {
      userId: viewerId,
      type: source.type,
      title: source.title,
      status: "WANT",
      coverUrl: source.coverUrl,
      visibility: "PRIVATE",
    },
  });
}

export { MEDIA_TYPE, MEDIA_STATUS, VIS as MEDIA_VIS };
