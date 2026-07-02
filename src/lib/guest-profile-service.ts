import { db } from "@/lib/db";
import { listMediaForViewer } from "@/lib/media-service";

export async function getGuestProfileBundle(
  ownerId: string,
  viewerId: string,
  viewerUsername?: string,
) {
  const [wishlists, media, achievements, challenges, profile] = await Promise.all([
    import("@/lib/wishlist-service").then((m) => m.listWishlistsForViewer(ownerId, viewerId, viewerUsername)),
    listMediaForViewer(ownerId, viewerId),
    getPublicAchievements(ownerId),
    getPublicChallenges(ownerId, viewerId),
    db.userProfile.findUnique({ where: { userId: ownerId } }),
  ]);

  return { wishlists, media, achievements, challenges, mascotStage: profile?.mascotStage ?? 0 };
}

async function getPublicAchievements(userId: string) {
  const defs = await db.achievementDef.findMany();
  const unlocked = await db.userAchievement.findMany({
    where: { userId, unlockedAt: { not: null } },
  });
  return defs
    .map((d) => {
      const ua = unlocked.find((u) => u.achievementId === d.id);
      if (!ua) return null;
      return {
        slug: d.slug,
        name: d.name,
        icon: d.icon,
        color: d.color,
        category: d.category,
        unlocked: true,
      };
    })
    .filter(Boolean);
}

async function getPublicChallenges(ownerId: string, _viewerId: string) {
  const posts = await db.post.findMany({
    where: {
      authorId: ownerId,
      type: "CHALLENGE",
      hiddenFromFeed: false,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      challenge: { include: { _count: { select: { participants: true } } } },
      author: { select: { username: true, name: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id,
    title: p.title ?? "Вызов",
    participants: p.challenge?._count.participants ?? 0,
    username: p.author.username,
  }));
}
