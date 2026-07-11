import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";

async function dailySeries(
  days: number,
  counter: (from: Date, to: Date) => Promise<number>,
) {
  const now = new Date();
  const out: { date: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(now, i);
    const from = startOfDay(day);
    const to = endOfDay(day);
    const count = await counter(from, to);
    out.push({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "EE", { locale: ru }),
      count,
    });
  }
  return out;
}

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
    hiddenPosts,
    featuredPosts,
    pushDevicesTotal,
    wishlistsTotal,
    mediaTotal,
    duelsTotal,
    sharedGoalsTotal,
    pendingJoinRequests,
    contentReportsTotal,
    calendarEventsTotal,
    pendingFriendships,
    recentUsers,
    recentPosts,
    recentActivities,
    usersByCity,
    postsByType,
    signupsByDay,
    postsByDay,
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
    db.post.count({ where: { hiddenFromFeed: true } }),
    db.post.count({ where: { featuredInFeed: true, hiddenFromFeed: false } }),
    db.pushDevice.count(),
    db.wishlist.count(),
    db.mediaItem.count(),
    db.duel.count(),
    db.sharedGoal.count(),
    db.moveJoinRequest.count({ where: { status: "PENDING" } }),
    db.contentReport.count(),
    db.personalCalendarEvent.count(),
    db.friendship.count({ where: { status: "PENDING" } }),
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
        hiddenFromFeed: true,
        featuredInFeed: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    db.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        createdAt: true,
        user: { select: { name: true, username: true } },
      },
    }),
    db.user.groupBy({
      by: ["city"],
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 6,
    }),
    db.post.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    dailySeries(7, (from, to) =>
      db.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    ),
    dailySeries(7, (from, to) =>
      db.post.count({ where: { createdAt: { gte: from, lte: to } } }),
    ),
  ]);

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
    hiddenPosts,
    featuredPosts,
    pushDevicesTotal,
    wishlistsTotal,
    mediaTotal,
    duelsTotal,
    sharedGoalsTotal,
    pendingJoinRequests,
    contentReportsTotal,
    calendarEventsTotal,
    pendingFriendships,
    recentUsers,
    recentPosts,
    recentActivities,
    usersByCity,
    postsByType,
    signupsByDay,
    postsByDay,
    generatedAt: now.toISOString(),
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

export type AdminDashboardData = {
  usersTotal: number;
  usersToday: number;
  usersWeek: number;
  postsTotal: number;
  postsToday: number;
  challengesTotal: number;
  eventsTotal: number;
  clubsTotal: number;
  diaryTasksTotal: number;
  friendshipsTotal: number;
  notificationsUnread: number;
  likesTotal: number;
  commentsTotal: number;
  hiddenPosts: number;
  featuredPosts: number;
  pushDevicesTotal: number;
  wishlistsTotal: number;
  mediaTotal: number;
  duelsTotal: number;
  sharedGoalsTotal: number;
  pendingJoinRequests: number;
  contentReportsTotal: number;
  calendarEventsTotal: number;
  pendingFriendships: number;
  generatedAt: string;
  signupsByDay: { date: string; label: string; count: number }[];
  postsByDay: { date: string; label: string; count: number }[];
  usersByCity: { city: string; count: number }[];
  postsByType: { type: string; count: number }[];
  recentUsers: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    verified: boolean;
    createdAt: string;
  }[];
  recentPosts: {
    id: string;
    type: string;
    title: string | null;
    content: string;
    city: string;
    hiddenFromFeed: boolean;
    featuredInFeed: boolean;
    createdAt: string;
    author: { name: string; username: string };
    likes: number;
    comments: number;
  }[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    createdAt: string;
    user: { name: string; username: string };
  }[];
};

export function toDashboardData(stats: AdminStats): AdminDashboardData {
  return {
    usersTotal: stats.usersTotal,
    usersToday: stats.usersToday,
    usersWeek: stats.usersWeek,
    postsTotal: stats.postsTotal,
    postsToday: stats.postsToday,
    challengesTotal: stats.challengesTotal,
    eventsTotal: stats.eventsTotal,
    clubsTotal: stats.clubsTotal,
    diaryTasksTotal: stats.diaryTasksTotal,
    friendshipsTotal: stats.friendshipsTotal,
    notificationsUnread: stats.notificationsUnread,
    likesTotal: stats.likesTotal,
    commentsTotal: stats.commentsTotal,
    hiddenPosts: stats.hiddenPosts,
    featuredPosts: stats.featuredPosts,
    pushDevicesTotal: stats.pushDevicesTotal,
    wishlistsTotal: stats.wishlistsTotal,
    mediaTotal: stats.mediaTotal,
    duelsTotal: stats.duelsTotal,
    sharedGoalsTotal: stats.sharedGoalsTotal,
    pendingJoinRequests: stats.pendingJoinRequests,
    contentReportsTotal: stats.contentReportsTotal,
    calendarEventsTotal: stats.calendarEventsTotal,
    pendingFriendships: stats.pendingFriendships,
    generatedAt: stats.generatedAt,
    signupsByDay: stats.signupsByDay,
    postsByDay: stats.postsByDay,
    usersByCity: stats.usersByCity.map((r) => ({ city: r.city, count: r._count._all })),
    postsByType: stats.postsByType.map((r) => ({ type: r.type, count: r._count._all })),
    recentUsers: stats.recentUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    recentPosts: stats.recentPosts.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      content: p.content,
      city: p.city,
      hiddenFromFeed: p.hiddenFromFeed,
      featuredInFeed: p.featuredInFeed,
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      likes: p._count.likes,
      comments: p._count.comments,
    })),
    recentActivities: stats.recentActivities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
      user: a.user,
    })),
  };
}
