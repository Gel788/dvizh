import type { MediaStatus, MediaType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";

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

export async function updateMediaItem(
  userId: string,
  itemId: string,
  input: {
    status?: string;
    rating?: number | null;
    review?: string | null;
    visibility?: string;
    pinned?: boolean;
  },
) {
  const item = await db.mediaItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return null;

  const status = input.status ? MEDIA_STATUS[input.status] ?? item.status : item.status;
  const updated = await db.mediaItem.update({
    where: { id: itemId },
    data: {
      status,
      rating: input.rating !== undefined ? input.rating : item.rating,
      review: input.review !== undefined ? input.review : item.review,
      visibility: input.visibility ? (VIS[input.visibility] ?? item.visibility) : item.visibility,
      pinned: input.pinned ?? item.pinned,
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
