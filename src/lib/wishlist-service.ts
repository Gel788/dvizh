import type { Visibility } from "@prisma/client";
import { db } from "@/lib/db";
import { sentenceCase } from "@/lib/text-format";

const VIS: Record<string, Visibility> = {
  private: "PRIVATE", friends: "FRIENDS", all: "PUBLIC", public: "PUBLIC",
};

function maskItems<T extends { reserved: boolean; reservedBy: string | null }>(
  items: T[],
  ownerId: string,
  viewerId: string,
  viewerUsername?: string,
): T[] {
  return items.map((item) => {
    if (!item.reserved) return item;
    if (viewerId === ownerId) {
      return { ...item, reservedBy: null };
    }
    if (item.reservedBy === viewerUsername) {
      return item;
    }
    return { ...item, reservedBy: null };
  });
}

export async function listWishlistsForViewer(ownerId: string, viewerId: string, viewerUsername?: string) {
  const lists = await db.wishlist.findMany({
    where: {
      userId: ownerId,
      ...(viewerId !== ownerId ? { visibility: { in: ["FRIENDS", "PUBLIC"] } } : {}),
    },
    include: { items: { orderBy: { title: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return lists.map((list) => ({
    ...list,
    items: maskItems(list.items, ownerId, viewerId, viewerUsername),
  }));
}

export async function createWishlistRecord(
  userId: string,
  input: {
    title: string;
    occasion?: string;
    eventAt?: string | null;
    visibility?: string;
    items?: { title: string; price?: string; link?: string; comment?: string }[];
  },
) {
  const visibility = VIS[input.visibility ?? "friends"] ?? "FRIENDS";
  const items = (input.items ?? []).filter((i) => i.title.trim());

  const list = await db.wishlist.create({
    data: {
      userId,
      title: sentenceCase(input.title),
      occasion: input.occasion?.trim() ? sentenceCase(input.occasion) : null,
      eventAt: input.eventAt ? new Date(input.eventAt) : null,
      visibility,
      items: items.length
        ? {
            create: items.map((item) => ({
              title: sentenceCase(item.title),
              price: item.price?.trim() || null,
              link: item.link?.trim() || null,
              comment: item.comment?.trim() ? sentenceCase(item.comment) : null,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });

  if (visibility !== "PRIVATE") {
    await db.activity.create({
      data: {
        userId,
        type: "WISHLIST_ADDED",
        visibility,
        title: list.title,
        body: list.occasion ?? `${items.length} подарков`,
        metadata: JSON.stringify({ wishlistId: list.id }),
      },
    });
  }

  return list;
}

export async function addWishlistItemRecord(
  userId: string,
  listId: string,
  input: { title: string; price?: string; link?: string; comment?: string },
) {
  const list = await db.wishlist.findFirst({ where: { id: listId, userId } });
  if (!list) return null;

  return db.wishlistItem.create({
    data: {
      listId,
      title: sentenceCase(input.title),
      price: input.price?.trim() || null,
      link: input.link?.trim() || null,
      comment: input.comment?.trim() ? sentenceCase(input.comment) : null,
    },
  });
}

async function canViewWishlist(viewerId: string, listId: string) {
  const list = await db.wishlist.findUnique({
    where: { id: listId },
    include: { user: { select: { id: true } } },
  });
  if (!list) return { ok: false as const };
  if (list.userId === viewerId) return { ok: true as const, list, isOwner: true };
  if (list.visibility === "PRIVATE") return { ok: false as const };
  if (list.visibility === "PUBLIC") return { ok: true as const, list, isOwner: false };
  const friend = await db.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: list.userId },
        { requesterId: list.userId, addresseeId: viewerId },
      ],
    },
  });
  return friend ? { ok: true as const, list, isOwner: false } : { ok: false as const };
}

export async function updateWishlistRecord(
  userId: string,
  listId: string,
  input: {
    title?: string;
    occasion?: string | null;
    eventAt?: string | null;
    visibility?: string;
  },
) {
  const list = await db.wishlist.findFirst({ where: { id: listId, userId } });
  if (!list) return null;

  return db.wishlist.update({
    where: { id: listId },
    data: {
      title: input.title !== undefined ? sentenceCase(input.title) : list.title,
      occasion: input.occasion !== undefined ? (input.occasion?.trim() ? sentenceCase(input.occasion) : null) : list.occasion,
      eventAt: input.eventAt !== undefined ? (input.eventAt ? new Date(input.eventAt) : null) : list.eventAt,
      visibility: input.visibility ? (VIS[input.visibility] ?? list.visibility) : list.visibility,
    },
    include: { items: { orderBy: { title: "asc" } } },
  });
}

export async function deleteWishlistRecord(userId: string, listId: string) {
  const list = await db.wishlist.findFirst({ where: { id: listId, userId } });
  if (!list) return false;
  await db.wishlist.delete({ where: { id: listId } });
  return true;
}

export async function updateWishlistItemRecord(
  userId: string,
  itemId: string,
  input: { title?: string; price?: string | null; link?: string | null; comment?: string | null },
) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item || item.list.userId !== userId) return null;

  return db.wishlistItem.update({
    where: { id: itemId },
    data: {
      title: input.title !== undefined ? sentenceCase(input.title) : item.title,
      price: input.price !== undefined ? (input.price?.trim() || null) : item.price,
      link: input.link !== undefined ? (input.link?.trim() || null) : item.link,
      comment: input.comment !== undefined ? (input.comment?.trim() ? sentenceCase(input.comment) : null) : item.comment,
    },
  });
}

export async function deleteWishlistItemRecord(userId: string, itemId: string) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item || item.list.userId !== userId) return false;
  await db.wishlistItem.delete({ where: { id: itemId } });
  return true;
}

export async function reserveWishlistItemRecord(
  viewerId: string,
  viewerUsername: string,
  itemId: string,
) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item) return { error: "NOT_FOUND" as const };
  if (item.list.userId === viewerId) return { error: "OWNER_CANNOT_RESERVE" as const };
  if (item.reserved) return { error: "TAKEN" as const };

  const access = await canViewWishlist(viewerId, item.listId);
  if (!access.ok) return { error: "FORBIDDEN" as const };

  await db.wishlistItem.update({
    where: { id: itemId },
    data: { reserved: true, reservedBy: viewerUsername },
  });

  return { reserved: true };
}
