import { db } from "@/lib/db";

export type ContentKind = "task" | "post" | "profile" | "wishlist" | "event" | "challenge";
export type ContentAction = "view" | "edit" | "comment" | "reserve";

export type RelationKind = "owner" | "friend" | "participant" | "invited" | "stranger" | "blocked";

export async function resolveRelation(
  viewerId: string | undefined,
  ownerId: string,
): Promise<RelationKind> {
  if (!viewerId) return "stranger";
  if (viewerId === ownerId) return "owner";

  const [blocked, friendship] = await Promise.all([
    db.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: ownerId },
          { blockerId: ownerId, blockedId: viewerId },
        ],
      },
      select: { id: true },
    }),
    db.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: viewerId, addresseeId: ownerId },
          { requesterId: ownerId, addresseeId: viewerId },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (blocked) return "blocked";
  if (friendship) return "friend";
  return "stranger";
}

export async function can(
  viewerId: string | undefined,
  contentKind: ContentKind,
  ownerId: string,
  action: ContentAction,
): Promise<{ allowed: boolean; reason?: string }> {
  const relation = await resolveRelation(viewerId, ownerId);

  if (relation === "blocked") {
    return { allowed: false, reason: "BLOCKED" };
  }

  if (relation === "owner") return { allowed: true };

  switch (contentKind) {
    case "task":
      if (action === "view") {
        return { allowed: false, reason: "OWNER_ONLY" };
      }
      return { allowed: false, reason: "ACCESS_DENIED" };
    case "wishlist":
      if (action === "reserve" && (relation === "friend" || relation === "stranger")) {
        return { allowed: true };
      }
      if (action === "view" && relation === "friend") return { allowed: true };
      return { allowed: false, reason: "ACCESS_DENIED" };
    case "post":
    case "event":
    case "challenge":
    case "profile":
      if (action === "view") return { allowed: true };
      if (action === "comment" && viewerId) return { allowed: true };
      return { allowed: false, reason: "ACCESS_DENIED" };
    default:
      return { allowed: false, reason: "ACCESS_DENIED" };
  }
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const rows = await db.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });
  const out = new Set<string>();
  for (const row of rows) {
    if (row.blockerId === userId) out.add(row.blockedId);
    else out.add(row.blockerId);
  }
  return [...out];
}

export async function getHiddenPostIds(userId: string): Promise<string[]> {
  const rows = await db.hiddenPost.findMany({
    where: { userId },
    select: { postId: true },
  });
  return rows.map((r) => r.postId);
}
