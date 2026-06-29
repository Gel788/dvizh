import { db } from "@/lib/db";

export async function getAdminStats() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    usersToday,
    usersWeek,
    postsTotal,
    postsToday,
    challengesTotal,
    eventsTotal,
    clubsTotal,
    achievementsTotal,
    diaryTasksTotal,
    friendshipsTotal,
    notificationsUnread,
    likesTotal,
    commentsTotal,
    recentUsers,
    recentPosts,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: dayAgo } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.post.count(),
    db.post.count({ where: { createdAt: { gte: dayAgo } } }),
    db.challenge.count(),
    db.event.count(),
    db.club.count(),
    db.achievementDef.count(),
    db.diaryTask.count(),
    db.friendship.count({ where: { status: "ACCEPTED" } }),
    db.notification.count({ where: { read: false } }),
    db.like.count(),
    db.comment.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        city: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  const usersByCity = await db.user.groupBy({
    by: ["city"],
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: 6,
  });

  const postsByType = await db.post.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  return {
    usersTotal,
    usersToday,
    usersWeek,
    postsTotal,
    postsToday,
    challengesTotal,
    eventsTotal,
    clubsTotal,
    achievementsTotal,
    diaryTasksTotal,
    friendshipsTotal,
    notificationsUnread,
    likesTotal,
    commentsTotal,
    recentUsers,
    recentPosts,
    usersByCity,
    postsByType,
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
