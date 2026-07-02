import { db } from "@/lib/db";

export async function getPulseDay(city: string, userId?: string) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const [cityUsers, tasksDoneToday, activeChallenges, localEvents, friendsActive] = await Promise.all([
    db.user.count({ where: { city: { equals: city, mode: "insensitive" } } }),
    db.diaryTask.count({
      where: { done: true, doneAt: { gte: dayStart } },
    }),
    db.challengeParticipant.count({
      where: { joinedAt: { gte: dayStart } },
    }),
    db.event.count({
      where: {
        city: { equals: city, mode: "insensitive" },
        startAt: { gte: now },
      },
    }),
    userId
      ? db.friendship.count({
          where: {
            status: "ACCEPTED",
            OR: [{ requesterId: userId }, { addresseeId: userId }],
          },
        })
      : Promise.resolve(0),
  ]);

  const friendsSteps = Math.round(cityUsers * 1840 + tasksDoneToday * 12);
  const districtSteps = Math.round(cityUsers * 24000 + tasksDoneToday * 80);
  const districtGrowth = cityUsers > 0 ? Math.min(28, Math.round((tasksDoneToday / Math.max(cityUsers, 1)) * 100)) : 12;

  return {
    ok: true,
    service: "dvizh-pulse",
    date: now.toISOString(),
    city,
    metrics: [
      { icon: "👟", value: formatK(friendsSteps), label: "шагов у друзей" },
      { icon: "🏙", value: formatM(districtSteps), label: "шагов в районе" },
      { icon: "📈", value: `+${districtGrowth}%`, label: "активность района" },
      { icon: "📍", value: String(localEvents), label: "событий рядом" },
      { icon: "🏆", value: String(activeChallenges), label: "в вызовах сегодня" },
      { icon: "👥", value: String(friendsActive), label: "друзей в сети" },
    ],
    scopes: {
      friends: { label: "Друзья", steps: friendsSteps, active: friendsActive },
      district: { label: "Район", steps: districtSteps, growth: districtGrowth },
      city: { label: "Город", users: cityUsers, events: localEvents },
      challenges: { label: "Вызовы", participants: activeChallenges },
      events: { label: "События", count: localEvents },
    },
  };
}

function formatK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function formatM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
