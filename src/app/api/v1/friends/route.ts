import { getFriendsFeed, getDuelsForUser } from "@/lib/diary-actions";
import { getSharedGoalsForUser } from "@/lib/social-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import {
  acceptFriendRequest,
  listPendingFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/lib/api/friendship-service";
import { db } from "@/lib/db";
import type { PostType } from "@prisma/client";

const friendSelect = {
  id: true,
  name: true,
  username: true,
  avatar: true,
  city: true,
  district: true,
  verified: true,
  reputation: true,
} as const;

export async function GET(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "feed";
  const city = searchParams.get("city") ?? session.city ?? "Москва";
  const type = (searchParams.get("type") as PostType | "ALL") ?? "ALL";

  if (view === "list") {
    const rows = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: session.id }, { addresseeId: session.id }],
      },
      include: { requester: { select: friendSelect }, addressee: { select: friendSelect } },
    });
    const friends = rows.map((r) =>
      r.requesterId === session.id ? r.addressee : r.requester,
    );
    return jsonOk({ friends });
  }

  if (view === "picker") {
    const { listFriendsForPicker } = await import("@/lib/api/social-create-service");
    const friends = await listFriendsForPicker(session.id);
    return jsonOk({ friends });
  }

  if (view === "duels") {
    const duels = await getDuelsForUser(session.id);
    return jsonOk({ duels });
  }

  if (view === "together") {
    const goals = await getSharedGoalsForUser(session.id);
    return jsonOk({ goals });
  }

  if (view === "pending") {
    const pending = await listPendingFriendRequests(session.id);
    return jsonOk({ pending });
  }

  const data = await getFriendsFeed(session.id, city, type, "feed");
  return jsonOk(data);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}

type FriendPostBody = {
  action: "request" | "accept" | "reject";
  userId?: string;
  friendshipId?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSessionFromRequest(request);
    const body = await readJson<FriendPostBody>(request);
    if (!body?.action) return jsonError("Укажите action", 400, "INVALID_BODY");

    if (body.action === "request") {
      if (!body.userId) return jsonError("Укажите userId", 400, "INVALID_BODY");
      const result = await sendFriendRequest(session, body.userId);
      if ("error" in result) return jsonError(result.error!, 400, "FRIEND_REQUEST_FAILED");
      return jsonOk(result);
    }

    if (body.action === "accept") {
      if (!body.friendshipId) return jsonError("Укажите friendshipId", 400, "INVALID_BODY");
      const result = await acceptFriendRequest(session, body.friendshipId);
      if ("error" in result) return jsonError(result.error!, 400, "FRIEND_ACCEPT_FAILED");
      return jsonOk(result);
    }

    if (body.action === "reject") {
      if (!body.friendshipId) return jsonError("Укажите friendshipId", 400, "INVALID_BODY");
      const result = await rejectFriendRequest(session, body.friendshipId);
      if ("error" in result) return jsonError(result.error!, 400, "FRIEND_REJECT_FAILED");
      return jsonOk(result);
    }

    return jsonError("Неизвестное действие", 400, "INVALID_ACTION");
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
