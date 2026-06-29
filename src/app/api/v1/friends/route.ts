import { getFriendsFeed, getDuelsForUser } from "@/lib/diary-actions";
import { getSharedGoalsForUser } from "@/lib/social-actions";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
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

  if (view === "duels") {
    const duels = await getDuelsForUser(session.id);
    return jsonOk({ duels });
  }

  if (view === "together") {
    const goals = await getSharedGoalsForUser(session.id);
    return jsonOk({ goals });
  }

  const data = await getFriendsFeed(session.id, city, type, "feed");
  return jsonOk(data);
  } catch {
    return jsonError("Требуется авторизация", 401, "UNAUTHORIZED");
  }
}
