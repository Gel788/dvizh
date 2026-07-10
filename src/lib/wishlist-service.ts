import type { Visibility } from "@prisma/client";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { sentenceCase } from "@/lib/text-format";

const VIS: Record<string, Visibility> = {
  private: "PRIVATE", friends: "FRIENDS", all: "PUBLIC", public: "PUBLIC",
};

function maskItems<T extends {
  reserved: boolean;
  reservedBy: string | null;
  reservationStatus?: string | null;
}>(
  items: T[],
  ownerId: string,
  viewerId: string,
  viewerUsername?: string,
  surpriseMode = true,
): T[] {
  return items.map((item) => {
    const active = item.reserved && item.reservationStatus !== "CANCELLED";
    if (!active) {
      return { ...item, reserved: false, reservedBy: null, reservationStatus: null as T["reservationStatus"] };
    }
    if (viewerId === ownerId) {
      if (surpriseMode) {
        return { ...item, reserved: false, reservedBy: null, reservationStatus: null as T["reservationStatus"] };
      }
      return item;
    }
    if (item.reservedBy === viewerUsername) {
      return item;
    }
    return { ...item, reserved: true, reservedBy: null, reservationStatus: "RESERVED" as T["reservationStatus"] };
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
    items: maskItems(list.items, ownerId, viewerId, viewerUsername, list.surpriseMode),
  }));
}

export async function createWishlistRecord(
  userId: string,
  input: {
    title: string;
    occasion?: string;
    eventAt?: string | null;
    visibility?: string;
    surpriseMode?: boolean;
    items?: { title: string; price?: string; link?: string; comment?: string }[];
  },
) {
  const visibility = VIS[input.visibility ?? "friends"] ?? "FRIENDS";
  const items = (input.items ?? []).filter((i) => i.title.trim());
  const surpriseMode = input.surpriseMode ?? visibility !== "PUBLIC";

  const list = await db.wishlist.create({
    data: {
      userId,
      title: sentenceCase(input.title),
      occasion: input.occasion?.trim() ? sentenceCase(input.occasion) : null,
      eventAt: input.eventAt ? new Date(input.eventAt) : null,
      visibility,
      surpriseMode,
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
    surpriseMode?: boolean;
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
      surpriseMode: input.surpriseMode ?? list.surpriseMode,
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
    data: { reserved: true, reservedBy: viewerUsername, reservationStatus: "RESERVED" },
  });

  return { reserved: true };
}

export async function cancelWishlistReservationRecord(
  viewerId: string,
  viewerUsername: string,
  itemId: string,
) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item) return { error: "NOT_FOUND" as const };
  if (!item.reserved || item.reservationStatus === "CANCELLED") {
    return { error: "NOT_RESERVED" as const };
  }
  if (item.reservedBy !== viewerUsername) return { error: "FORBIDDEN" as const };

  await db.wishlistItem.update({
    where: { id: itemId },
    data: { reserved: false, reservedBy: null, reservationStatus: "CANCELLED" },
  });

  return { cancelled: true };
}

export async function markWishlistItemBoughtRecord(
  viewerId: string,
  viewerUsername: string,
  itemId: string,
) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item) return { error: "NOT_FOUND" as const };
  if (!item.reserved || item.reservationStatus === "CANCELLED") {
    return { error: "NOT_RESERVED" as const };
  }
  if (item.reservedBy !== viewerUsername) return { error: "FORBIDDEN" as const };

  await db.wishlistItem.update({
    where: { id: itemId },
    data: { reserved: true, reservationStatus: "BOUGHT" },
  });

  return { bought: true };
}

function shareUrlForToken(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.flroal.ru";
  return `${base.replace(/\/$/, "")}/wishlists/share/${token}`;
}

export async function createWishlistShareLink(ownerId: string, listId: string) {
  const list = await db.wishlist.findFirst({
    where: { id: listId, userId: ownerId },
    select: { id: true, title: true, shareToken: true },
  });
  if (!list) return null;

  const token =
    list.shareToken ??
    (await (async () => {
      const next = crypto.randomUUID().replace(/-/g, "");
      await db.wishlist.update({
        where: { id: listId },
        data: { shareToken: next },
      });
      return next;
    })());

  return {
    wishlistId: list.id,
    title: list.title,
    token,
    url: shareUrlForToken(token),
  };
}

export async function getWishlistByShareToken(
  token: string,
  viewerId?: string,
  viewerUsername?: string,
) {
  const list = await db.wishlist.findFirst({
    where: { shareToken: token },
    include: { items: { orderBy: { title: "asc" } }, user: { select: { id: true, name: true, username: true } } },
  });
  if (!list) return null;

  const ownerId = list.userId;
  const viewer = viewerId ?? "";

  let canView = viewer === ownerId || list.visibility === "PUBLIC";
  if (!canView && list.visibility === "FRIENDS" && viewerId) {
    canView = !!(await db.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: viewerId, addresseeId: ownerId },
          { requesterId: ownerId, addresseeId: viewerId },
        ],
      },
    }));
  }

  if (!canView) return { error: "FORBIDDEN" as const };

  return {
    wishlist: {
      ...list,
      items: maskItems(list.items, ownerId, viewer, viewerUsername, list.surpriseMode),
    },
  };
}
