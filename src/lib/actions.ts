"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
  findUserByEmail,
  normalizeEmail,
  type SessionUser,
} from "@/lib/auth";
import { haversineKm, parseTags } from "@/lib/geo";
import type {
  AnnouncementCategory,
  PostType,
  NotificationType,
} from "@prisma/client";

export async function registerAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const city = String(formData.get("city") ?? "Москва");

  if (!email || !password || !name || !username) {
    redirect("/register?error=empty");
  }

  const exists = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { username },
      ],
    },
  });
  if (exists) redirect("/register?error=exists");

  const user = await db.user.create({
    data: {
      email,
      password: await hashPassword(password),
      name,
      username,
      city,
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password))) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  const next = String(formData.get("next") ?? "").trim();
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createPostAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const type = String(formData.get("type")) as PostType;
  const content = String(formData.get("content") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  const city = String(formData.get("city") ?? session.city);
  const district = String(formData.get("district") ?? "").trim() || null;
  const tagsRaw = String(formData.get("tags") ?? "");
  const lat = formData.get("lat") ? Number(formData.get("lat")) : session.lat ?? null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : session.lng ?? null;
  const radiusKm = Number(formData.get("radiusKm") ?? 5);

  if (!content) return;

  const tags = parseTags(tagsRaw).join(",");

  const post = await db.post.create({
    data: {
      type,
      authorId: session.id,
      title,
      content,
      city,
      district,
      lat,
      lng,
      radiusKm,
      tags,
      category:
        type === "ANNOUNCEMENT"
          ? (String(formData.get("category") ?? "OTHER") as AnnouncementCategory)
          : null,
      contactInfo: String(formData.get("contactInfo") ?? "").trim() || null,
      expiresAt: formData.get("expiresAt")
        ? new Date(String(formData.get("expiresAt")))
        : null,
      challenge:
        type === "CHALLENGE"
          ? {
              create: {
                goalCount: Number(formData.get("goalCount") ?? 1),
                deadline: formData.get("deadline")
                  ? new Date(String(formData.get("deadline")))
                  : null,
                rules: String(formData.get("rules") ?? "").trim() || null,
                isBusiness: formData.get("isBusiness") === "on",
                businessName: String(formData.get("businessName") ?? "").trim() || null,
                reward: String(formData.get("reward") ?? "").trim() || null,
                isSeasonal: formData.get("isSeasonal") === "on",
                seasonName: String(formData.get("seasonName") ?? "").trim() || null,
              },
            }
          : undefined,
    },
  });

  revalidatePath("/");
  redirect(`/post/${post.id}`);
}

export async function toggleLikeAction(postId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
  } else {
    await db.like.create({ data: { postId, userId: session.id } });
    const post = await db.post.findUnique({ where: { id: postId } });
    if (post && post.authorId !== session.id) {
      await db.notification.create({
        data: {
          userId: post.authorId,
          type: "LIKE",
          title: `${session.name} лайкнул ваш пост`,
          body: post.content.slice(0, 80),
          link: `/post/${postId}`,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export async function addCommentAction(postId: string, content: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!content.trim()) return;

  await db.comment.create({
    data: { postId, userId: session.id, content: content.trim() },
  });

  const post = await db.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== session.id) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENT",
        title: `${session.name} прокомментировал`,
        body: content.trim().slice(0, 80),
        link: `/post/${postId}`,
      },
    });
  }

  revalidatePath(`/post/${postId}`);
}

export async function toggleGoingAction(postId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const existing = await db.going.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  });

  if (existing) {
    await db.going.delete({ where: { id: existing.id } });
  } else {
    await db.going.create({ data: { postId, userId: session.id } });
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export async function repostAction(postId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db.repost.upsert({
    where: { postId_userId: { postId, userId: session.id } },
    create: { postId, userId: session.id },
    update: {},
  });

  revalidatePath("/");
}

export async function joinChallengeAction(challengeId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId, userId: session.id } },
    create: { challengeId, userId: session.id },
    update: {},
  });

  revalidatePath("/challenges");
  revalidatePath("/");
}

export async function leaveChallengeAction(challengeId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db.challengeParticipant.deleteMany({
    where: { challengeId, userId: session.id },
  });

  revalidatePath("/challenges");
  revalidatePath("/");
}

export async function submitChallengeReportAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const challengeId = String(formData.get("challengeId"));
  const content = String(formData.get("content") ?? "").trim();
  const postId = String(formData.get("postId"));

  if (!content) return;

  await db.challengeReport.create({
    data: {
      challengeId,
      userId: session.id,
      content,
      lat: session.lat,
      lng: session.lng,
    },
  });

  const participant = await db.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.id } },
  });

  if (participant) {
    await db.challengeParticipant.update({
      where: { id: participant.id },
      data: { progress: participant.progress + 1, streak: participant.streak + 1 },
    });
  }

  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    include: { post: true },
  });

  if (challenge) {
    const followers = await db.follow.findMany({
      where: { followingId: session.id },
      select: { followerId: true },
    });
    await db.notification.createMany({
      data: followers.map((f) => ({
        userId: f.followerId,
        type: "FRIEND_COMPLETED" as NotificationType,
        title: `${session.name} выполнил челлендж`,
        body: challenge.post.title ?? content.slice(0, 60),
        link: `/post/${challenge.postId}`,
      })),
    });
  }

  revalidatePath(`/post/${postId}`);
  revalidatePath("/challenges");
}

export async function toggleFollowAction(userId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.id === userId) return;

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: session.id, followingId: userId } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
  } else {
    await db.follow.create({
      data: { followerId: session.id, followingId: userId },
    });
    await db.notification.create({
      data: {
        userId,
        type: "FOLLOW",
        title: `${session.name} подписался на вас`,
        body: `@${session.username}`,
        link: `/profile/${session.username}`,
      },
    });
  }

  revalidatePath(`/profile/${userId}`);
}

export async function friendRequestAction(userId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { sendFriendRequest } = await import("@/lib/api/friendship-service");
  await sendFriendRequest(session, userId);
  revalidatePath(`/profile/${userId}`);
  revalidatePath("/search");
  revalidatePath("/friends");
}

export async function acceptFriendAction(friendshipId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { acceptFriendRequest } = await import("@/lib/api/friendship-service");
  await acceptFriendRequest(session, friendshipId);
  revalidatePath("/friends");
  revalidatePath("/profile");
  revalidatePath("/search");
}

export async function rejectFriendAction(friendshipId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { rejectFriendRequest } = await import("@/lib/api/friendship-service");
  await rejectFriendRequest(session, friendshipId);
  revalidatePath("/friends");
  revalidatePath("/search");
}

export async function uploadAvatarAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const dataUrl = String(formData.get("avatar") ?? "");
  if (!dataUrl.startsWith("data:image/")) return;

  const { saveAvatarFromDataUrl } = await import("@/lib/upload/avatar");
  const avatar = await saveAvatarFromDataUrl(session.id, dataUrl);

  await db.user.update({ where: { id: session.id }, data: { avatar } });
  revalidatePath("/settings");
  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/");
}

export async function joinClubAction(clubId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db.clubMember.upsert({
    where: { clubId_userId: { clubId, userId: session.id } },
    create: { clubId, userId: session.id },
    update: {},
  });

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${clubId}`);
}

export async function joinEventAction(eventId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId: session.id } },
    create: { eventId, userId: session.id },
    update: {},
  });

  revalidatePath("/events");
}

export async function createClubAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? session.city);
  const district = String(formData.get("district") ?? "").trim() || null;
  const isPrivate = formData.get("isPrivate") === "on";

  if (!name || !description) return;

  const club = await db.club.create({
    data: {
      name,
      description,
      city,
      district,
      isPrivate,
      creatorId: session.id,
      members: { create: { userId: session.id, role: "ADMIN" } },
    },
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function createEventAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? session.city);
  const district = String(formData.get("district") ?? "").trim() || null;
  const startAt = new Date(String(formData.get("startAt")));
  const clubId = String(formData.get("clubId") ?? "").trim() || null;
  const isSeasonal = formData.get("isSeasonal") === "on";

  if (!title || !description) return;

  await db.event.create({
    data: {
      title,
      description,
      organizerId: session.id,
      city,
      district,
      startAt,
      clubId,
      isSeasonal,
      lat: session.lat,
      lng: session.lng,
      attendees: { create: { userId: session.id } },
    },
  });

  revalidatePath("/events");
  redirect("/events");
}

export async function markNotificationsReadAction() {
  const session = await getSession();
  if (!session) return;

  await db.notification.updateMany({
    where: { userId: session.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");

  await db.user.update({
    where: { id: session.id },
    data: {
      name: String(formData.get("name") ?? session.name).trim(),
      bio: String(formData.get("bio") ?? "").trim() || null,
      city: String(formData.get("city") ?? session.city),
      district: String(formData.get("district") ?? "").trim() || null,
      ...(latRaw != null && latRaw !== "" ? { lat: Number(latRaw) } : {}),
      ...(lngRaw != null && lngRaw !== "" ? { lng: Number(lngRaw) } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/nearby");
  revalidatePath("/");
  revalidatePath(`/profile/${session.username}`);
}

export async function syncUserLocationAction(lat: number, lng: number) {
  const session = await getSession();
  if (!session) return { ok: false as const };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false as const };

  await db.user.update({
    where: { id: session.id },
    data: { lat, lng },
  });

  revalidatePath("/nearby");
  revalidatePath("/");
  return { ok: true as const };
}

export type FeedFilters = {
  city?: string;
  type?: PostType | "ALL";
  district?: string;
  tag?: string;
  radiusKm?: number;
  userLat?: number;
  userLng?: number;
  feed?: "all" | "following" | "nearby";
};

export async function getFeedPosts(
  filters: FeedFilters = {},
  sessionOverride?: SessionUser | null
) {
  const session =
    sessionOverride !== undefined ? sessionOverride : await getSession();
  const where: Record<string, unknown> = {};

  if (filters.city) where.city = filters.city;
  where.hiddenFromFeed = false;
  if (filters.type && filters.type !== "ALL") where.type = filters.type;
  if (filters.district) where.district = filters.district;
  if (filters.tag) where.tags = { contains: filters.tag };

  if (filters.feed === "following") {
    if (!session) return [];

    const follows = await db.follow.findMany({
      where: { followerId: session.id },
      select: { followingId: true },
    });
    const districtFollows = await db.districtFollow.findMany({
      where: { userId: session.id },
    });
    const tagFollows = await db.tagFollow.findMany({
      where: { userId: session.id },
    });

    const authorIds = follows.map((f) => f.followingId);
    const orConditions: Record<string, unknown>[] = [];

    if (authorIds.length) orConditions.push({ authorId: { in: authorIds } });
    for (const d of districtFollows) {
      orConditions.push({ district: d.district, city: d.city });
    }
    for (const t of tagFollows) {
      orConditions.push({ tags: { contains: t.tag } });
    }

    if (orConditions.length) where.OR = orConditions;
    else return [];
  }

  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          verified: true,
          city: true,
          district: true,
        },
      },
      challenge: {
        include: {
          participants: session ? { where: { userId: session.id }, select: { id: true } } : false,
          _count: { select: { reports: true, participants: true } },
        },
      },
      _count: { select: { likes: true, comments: true, going: true, reposts: true } },
      likes: session ? { where: { userId: session.id }, select: { id: true } } : false,
      going: session ? { where: { userId: session.id }, select: { id: true } } : false,
    },
  });

  let result = posts;

  if (
    filters.feed === "nearby" &&
    filters.userLat != null &&
    filters.userLng != null
  ) {
    const radius = filters.radiusKm ?? 10;
    result = posts.filter((p) => {
      if (p.lat == null || p.lng == null) return false;
      return haversineKm(filters.userLat!, filters.userLng!, p.lat, p.lng) <= radius;
    });
  }

  return result;
}

export async function getLeaderboard(city: string, district?: string) {
  const users = await db.user.findMany({
    where: { city, ...(district ? { district } : {}) },
    orderBy: { reputation: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      verified: true,
      reputation: true,
      district: true,
      badges: { include: { badge: true }, take: 3 },
      _count: {
        select: {
          challengeParts: true,
          posts: true,
        },
      },
    },
  });
  return users;
}

export async function getChallengeLeaderboard(
  city?: string,
  scope: "local" | "global" | "friends" | "district" = "local",
  userId?: string,
  district?: string,
) {
  let authorIds: string[] | undefined;
  if (scope === "friends" && userId) {
    const follows = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const friendRows = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
    authorIds = [
      ...new Set([
        ...follows.map((f) => f.followingId),
        ...friendRows.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId)),
      ]),
    ];
    if (!authorIds.length) return [];
  }

  const challenges = await db.challenge.findMany({
    where: {
      ...(scope === "local" && city ? { post: { city, hiddenFromFeed: false } } : {}),
      ...(scope === "district" && city
        ? {
            post: {
              city,
              hiddenFromFeed: false,
              ...(district ? { district } : {}),
            },
          }
        : {}),
      ...(scope === "global" ? { isGlobal: true, post: { hiddenFromFeed: false } } : {}),
      ...(scope === "friends" && authorIds ? { post: { authorId: { in: authorIds }, hiddenFromFeed: false } } : {}),
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          city: true,
          district: true,
          author: {
            select: { id: true, name: true, username: true, avatar: true, verified: true },
          },
        },
      },
      participants: {
        orderBy: { progress: "desc" },
        take: 1,
        include: { user: { select: { name: true, username: true } } },
      },
      _count: { select: { participants: true, reports: true } },
    },
    orderBy: { participants: { _count: "desc" } },
    take: 20,
  });

  if (!userId) return challenges.map((c) => ({ ...c, viewerJoined: false, myProgress: 0 }));

  const myParts = await db.challengeParticipant.findMany({
    where: { userId, challengeId: { in: challenges.map((c) => c.id) } },
    select: { challengeId: true, progress: true },
  });
  const myMap = new Map(myParts.map((p) => [p.challengeId, p.progress]));

  return challenges.map((c) => ({
    ...c,
    viewerJoined: myMap.has(c.id),
    myProgress: myMap.get(c.id) ?? 0,
  }));
}

export async function searchPlatform(q: string, city?: string, viewerId?: string) {
  const term = q.trim();
  if (term.length < 2) return { users: [], posts: [], challenges: [], events: [], query: term };

  const [users, posts, challenges, events] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { username: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { reputation: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        city: true,
        district: true,
        verified: true,
        reputation: true,
        _count: { select: { followers: true, posts: true } },
      },
    }),
    db.post.findMany({
      where: {
        hiddenFromFeed: false,
        ...(city ? { city } : {}),
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { content: { contains: term, mode: "insensitive" } },
          { tags: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true } },
        _count: { select: { likes: true, comments: true, going: true, reposts: true } },
      },
    }),
    db.challenge.findMany({
      where: {
        post: {
          hiddenFromFeed: false,
          ...(city ? { city } : {}),
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { content: { contains: term, mode: "insensitive" } },
            { tags: { contains: term, mode: "insensitive" } },
          ],
        },
      },
      orderBy: { post: { createdAt: "desc" } },
      take: 12,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            city: true,
            district: true,
            type: true,
            author: { select: { id: true, name: true, username: true, avatar: true, verified: true } },
          },
        },
        _count: { select: { participants: true } },
      },
    }),
    db.event.findMany({
      where: {
        ...(city ? { city } : {}),
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { startAt: "asc" },
      take: 12,
      include: {
        organizer: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { attendees: true } },
      },
    }),
  ]);

  if (viewerId && users.length > 0) {
    const { enrichUsersWithSocial } = await import("@/lib/api/friendship-service");
    const social = await enrichUsersWithSocial(
      viewerId,
      users.map((u) => u.id).filter((id) => id !== viewerId),
    );
    return {
      users: users.map((u) => ({
        ...u,
        isFollowing: social[u.id]?.isFollowing ?? false,
        friendshipState: social[u.id]?.friendshipState ?? "none",
        friendshipId: social[u.id]?.friendshipId ?? null,
      })),
      posts,
      challenges,
      events,
      query: term,
    };
  }

  return { users, posts, challenges, events, query: term };
}

export async function getStats() {
  try {
  const [users, postsToday, challenges, events] = await Promise.all([
    db.user.count(),
    db.post.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    db.challenge.count(),
    db.event.count({
      where: { startAt: { gte: new Date() } },
    }),
  ]);
  return { users, postsToday, challenges, events };
  } catch {
    return { users: 0, postsToday: 0, challenges: 0, events: 0 };
  }
}
