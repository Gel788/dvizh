"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DiaryPeriod, Visibility, PostType } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseTags } from "@/lib/geo";
import { ACHIEVEMENT_DEFS, PERIOD_XP, effectiveLevel, streakXpMultiplier } from "@/lib/gamification";
import { THEMES } from "@/lib/achievements-generator";
import { getSharedGoalsForUser } from "@/lib/social-actions";
import { normalizePostImages } from "@/lib/media-url";
import { resolveContentCities } from "@/lib/feed-scope";
import {
  canViewerSeeActivity,
  diaryActivityVisibility,
  loadPrivacyByUserIds,
  sanitizeActivityForViewer,
} from "@/lib/privacy-access";
import {
  DEFAULT_TZ_OFFSET_MINUTES,
  addUserLocalDays,
  diaryPeriodFrames,
  parseTzOffset,
  startOfUserDay,
  userDayKey,
  userLocalParts,
} from "@/lib/diary-time";

const PERIOD_MAP: Record<string, DiaryPeriod> = {
  today: "TODAY", tomorrow: "TOMORROW", week: "WEEK", month: "MONTH", year: "YEAR", dream: "DREAM",
};

const VIS_MAP: Record<string, Visibility> = {
  private: "PRIVATE", friends: "FRIENDS", all: "PUBLIC",
};

export type DiaryTaskDto = {
  id: string;
  text: string;
  tag?: string;
  note?: string;
  streak?: number;
  visibility?: "private" | "friends" | "all";
  done: boolean;
  copyCount?: number;
  dueDate?: string;
  isRecurring?: boolean;
  checklist?: string;
  checklistItems?: ChecklistItem[];
  reminderAt?: string;
  hashtagColor?: string;
  priority?: boolean;
  askProof?: boolean;
  hasTime?: boolean;
  scheduledAt?: string;
};

export type PersonalEventDto = {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  hasTime?: boolean;
  scheduledAt?: string;
  isRecurring?: boolean;
  reminderAt?: string;
  visibility?: "private" | "friends" | "all";
  note?: string;
};

export type DiaryBundle = {
  xp: number;
  level: number;
  diaryDay: string;
  tzOffsetMinutes: number;
  periodFrames: Record<string, string>;
  tasks: Record<string, DiaryTaskDto[]>;
  achievements: { slug: string; name: string; description: string; icon: string; color: string; unlocked: boolean; progress: number; threshold: number; category: string }[];
  duels: Awaited<ReturnType<typeof getDuelsForUser>>;
  sharedGoals: Awaited<ReturnType<typeof getSharedGoalsForUser>>;
  wishlists: Awaited<ReturnType<typeof getWishlistsForUser>>;
  media: Awaited<ReturnType<typeof getMediaForUser>>;
  privacy: ReturnType<typeof privacyToClient>;
  districtFollows: { district: string; city: string }[];
  calendar: Awaited<ReturnType<typeof getCalendarData>>;
  health: { connected: boolean; steps: number; distanceKm: number };
};

function toClientPeriod(p: DiaryPeriod): string {
  return p.toLowerCase() as string;
}

function toClientVis(v: Visibility): "private" | "friends" | "all" {
  if (v === "PUBLIC") return "all";
  if (v === "FRIENDS") return "friends";
  return "private";
}

type ChecklistItem = { text: string; done: boolean };

function parseChecklistJson(raw: string): ChecklistItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") return { text: item, done: false };
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          return {
            text: String(o.text ?? o.t ?? ""),
            done: Boolean(o.done ?? o.d),
          };
        }
        return { text: "", done: false };
      })
      .filter((i) => i.text);
  } catch {
    return [];
  }
}

/** Смена календарного дня: завтра → сегодня, сброс рекуррентных, скрытие вчерашних done. */
async function rolloverDiaryTasksForUser(
  userId: string,
  now = new Date(),
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
) {
  const todayStart = startOfUserDay(now, tzOffsetMinutes);

  await db.diaryTask.updateMany({
    where: { userId, period: "TOMORROW", done: false },
    data: { period: "TODAY" },
  });

  const recurring = await db.diaryTask.findMany({
    where: {
      userId,
      isRecurring: true,
      recurrence: "DAILY",
      done: true,
      doneAt: { lt: todayStart },
    },
  });
  for (const task of recurring) {
    const items = parseChecklistJson(task.checklistJson).map((i) => ({ ...i, done: false }));
    await db.diaryTask.update({
      where: { id: task.id },
      data: {
        done: false,
        doneAt: null,
        checklistJson: JSON.stringify(items),
      },
    });
  }
}

function privacyToClient(p: Awaited<ReturnType<typeof getPrivacyForUser>>) {
  return {
    defaultDiary: toClientVis(p.defaultDiary),
    defaultWishlist: toClientVis(p.defaultWishlist),
    defaultMedia: toClientVis(p.defaultMedia),
    defaultEvents: toClientVis(p.defaultEvents),
    locationPrecision: p.locationPrecision,
    profileInSearch: p.profileInSearch,
    diaryScope: p.diaryScope,
    friendRequests: p.friendRequests,
    subscriptions: p.subscriptions,
  };
}

export async function ensureProfile(userId: string) {
  return db.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function checkAchievements(userId: string, profile: { tasksCompleted: number; tasksCreated: number; level: number }) {
  const defs = await db.achievementDef.findMany();
  const existing = await db.userAchievement.findMany({ where: { userId } });
  const unlockedSlugs: string[] = [];
  const achVisibility = await diaryActivityVisibility(userId);

  const [friendCount, challengeJoins, challengeCreates, duelCount, wishlistCount, mediaReviews, maxStreak, doneTasks] = await Promise.all([
    db.friendship.count({ where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] } }),
    db.challengeParticipant.count({ where: { userId } }),
    db.challenge.count({ where: { post: { authorId: userId } } }),
    db.duelParticipant.count({ where: { userId } }),
    db.wishlist.count({ where: { userId } }),
    db.mediaItem.count({ where: { userId, review: { not: null } } }),
    db.diaryTask.aggregate({ where: { userId, done: true }, _max: { streak: true } }),
    db.diaryTask.findMany({ where: { userId, done: true }, select: { title: true, hashtag: true } }),
  ]);

  const themeCounts: Record<string, number> = {};
  for (const theme of THEMES) themeCounts[theme.key] = 0;
  for (const t of doneTasks) {
    const hay = `${t.title} ${t.hashtag ?? ""}`.toLowerCase();
    for (const theme of THEMES) {
      if (theme.synonyms.some((s) => hay.includes(s))) themeCounts[theme.key]++;
    }
  }

  for (const def of defs) {
    const row = existing.find((e) => e.achievementId === def.id);
    let progress = 0;

    if (def.slug.startsWith("tasks-")) progress = profile.tasksCompleted;
    else if (def.slug.startsWith("created-")) progress = profile.tasksCreated;
    else if (def.slug.startsWith("level-")) progress = profile.level;
    else if (def.slug.startsWith("streak-")) progress = maxStreak._max.streak ?? 0;
    else if (def.slug.startsWith("friends-")) progress = friendCount;
    else if (def.slug.startsWith("theme-")) {
      const key = def.slug.split("-")[1];
      progress = themeCounts[key] ?? 0;
    } else if (def.slug.startsWith("challenge-join")) progress = challengeJoins;
    else if (def.slug.startsWith("challenge-create")) progress = challengeCreates;
    else if (def.slug === "duel-1") progress = duelCount;
    else if (def.slug === "wishlist-1") progress = wishlistCount;
    else if (def.slug === "media-review-1") progress = mediaReviews;
    else if (def.slug === "mascot-1") {
      const p = await db.userProfile.findUnique({ where: { userId } });
      progress = (p?.mascotStage ?? 0) >= 1 ? 1 : 0;
    }

    const hit = progress >= def.threshold;
    await db.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: def.id } },
      create: { userId, achievementId: def.id, progress, unlockedAt: hit ? new Date() : null },
      update: { progress, ...(hit && !row?.unlockedAt ? { unlockedAt: new Date() } : {}) },
    });

    if (hit && !row?.unlockedAt) {
      unlockedSlugs.push(def.slug);
      if (achVisibility !== "PRIVATE") {
        await db.activity.create({
          data: {
            userId,
            type: "ACHIEVEMENT_UNLOCKED",
            visibility: achVisibility,
            title: `Ачивка: ${def.name}`,
            body: def.description,
          },
        });
      }
    }
  }
  return unlockedSlugs;
}

export async function getDiaryBundle(
  userId: string,
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
): Promise<DiaryBundle> {
  const profile = await ensureProfile(userId);
  const level = effectiveLevel(profile.xp, profile.level, profile.levelUnlockedAt);
  const now = new Date();
  const todayStart = startOfUserDay(now, tzOffsetMinutes);

  await rolloverDiaryTasksForUser(userId, now, tzOffsetMinutes);

  const tasks = await db.diaryTask.findMany({
    where: { userId },
    orderBy: [{ period: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const grouped: Record<string, DiaryTaskDto[]> = {
    today: [], tomorrow: [], week: [], month: [], year: [], dream: [],
  };
  for (const t of tasks) {
    if (t.period === "TODAY" && t.done && t.doneAt && t.doneAt < todayStart) {
      continue;
    }
    const key = toClientPeriod(t.period);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      id: t.id,
      text: t.title,
      tag: t.hashtag ?? undefined,
      note: t.note ?? undefined,
      streak: t.streak || undefined,
      visibility: toClientVis(t.visibility),
      done: t.done,
      copyCount: t.copyCount || undefined,
      dueDate: t.dueDate?.toISOString(),
      hasTime: t.hasTime || undefined,
      scheduledAt: t.scheduledAt?.toISOString(),
      isRecurring: t.isRecurring,
      checklist: t.checklistJson !== "[]" ? t.checklistJson : undefined,
      checklistItems: parseChecklistJson(t.checklistJson),
      reminderAt: t.reminderAt?.toISOString(),
      hashtagColor: t.hashtagColor ?? undefined,
      priority: t.priority || undefined,
      askProof: t.askProof || undefined,
    });
  }

  const defs = await db.achievementDef.findMany();
  const userAch = await db.userAchievement.findMany({ where: { userId } });
  const achievements = defs.map((d) => {
    const ua = userAch.find((u) => u.achievementId === d.id);
    return {
      slug: d.slug,
      name: d.name,
      description: d.description,
      icon: d.icon,
      color: d.color,
      unlocked: !!ua?.unlockedAt,
      progress: ua?.progress ?? 0,
      threshold: d.threshold,
      category: d.category,
    };
  });

  const local = userLocalParts(now, tzOffsetMinutes);
  const [duels, sharedGoals, wishlists, media, privacyRow, districtFollows] = await Promise.all([
    getDuelsForUser(userId),
    getSharedGoalsForUser(userId),
    getWishlistsForUser(userId),
    getMediaForUser(userId),
    getPrivacyForUser(userId),
    db.districtFollow.findMany({ where: { userId }, select: { district: true, city: true } }),
  ]);
  const privacy = privacyToClient(privacyRow);

  return {
    xp: profile.xp,
    level,
    diaryDay: userDayKey(now, tzOffsetMinutes),
    tzOffsetMinutes,
    periodFrames: diaryPeriodFrames(now, tzOffsetMinutes),
    tasks: grouped,
    achievements,
    duels,
    sharedGoals,
    wishlists,
    media,
    privacy,
    districtFollows,
    calendar: { year: local.year, month: local.month, days: {} },
    health: {
      connected: profile.healthConnected,
      steps: profile.healthSteps,
      distanceKm: profile.healthDistanceKm,
    },
  };
}

export async function completeDiaryTaskForUser(userId: string, taskId: string) {
  const task = await db.diaryTask.findFirst({ where: { id: taskId, userId } });
  if (!task || task.done) return { xpGain: 0, levelUp: false, newLevel: 0, achievements: [] as string[] };

  const nextStreak = task.trackStreak ? task.streak + 1 : task.streak;
  const base = PERIOD_XP[task.period];
  const gain = Math.round(base * (task.trackStreak ? streakXpMultiplier(nextStreak) : 1));
  const profile = await ensureProfile(userId);
  const before = effectiveLevel(profile.xp, profile.level, profile.levelUnlockedAt);
  const newXp = profile.xp + gain;

  await db.diaryTask.update({
    where: { id: taskId },
    data: {
      done: true,
      doneAt: new Date(),
      ...(task.trackStreak ? { streak: nextStreak } : {}),
    },
  });

  const afterLevel = effectiveLevel(newXp, profile.level, profile.levelUnlockedAt);
  const levelUp = afterLevel > before;

  await db.userProfile.update({
    where: { userId },
    data: {
      xp: newXp,
      level: levelUp ? afterLevel : profile.level,
      levelUnlockedAt: levelUp ? new Date() : profile.levelUnlockedAt,
      tasksCompleted: profile.tasksCompleted + 1,
    },
  });

  const vis = task.visibility;
  if (vis !== "PRIVATE") {
    await db.activity.create({
      data: {
        userId,
        type: "TASK_COMPLETED",
        visibility: vis,
        title: task.title,
        body: task.hashtag ? `#${task.hashtag}` : null,
        xpGained: gain,
        taskId: task.id,
      },
    });
  }

  let unlocked: string[] = [];
  try {
    unlocked = await checkAchievements(userId, {
      tasksCompleted: profile.tasksCompleted + 1,
      tasksCreated: profile.tasksCreated,
      level: afterLevel,
    });
  } catch {
    // ачивки не должны блокировать отметку задачи
  }

  return { xpGain: gain, levelUp, newLevel: afterLevel, achievements: unlocked };
}

export async function completeDiaryTaskAction(taskId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const result = await completeDiaryTaskForUser(session.id, taskId);
  if (result.xpGain === 0 && !result.levelUp) return result;

  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
  revalidatePath("/");
  return result;
}

export async function createDiaryTaskForUser(
  userId: string,
  input: {
    text: string;
    note?: string;
    period: string;
    visibility: string;
    hashtag?: string;
    dueDate?: string;
    isRecurring?: boolean;
    recurrence?: string;
    trackStreak?: boolean;
    reminderAt?: string;
    checklist?: string[];
    multiLine?: boolean;
    hashtagColor?: string;
    priority?: boolean;
    askProof?: boolean;
    hasTime?: boolean;
    scheduledAt?: string;
  },
) {
  const lines = input.multiLine
    ? input.text.split("\n").map((l) => l.trim()).filter(Boolean)
    : [input.text.trim()].filter(Boolean);
  if (!lines.length) return [];

  const period = PERIOD_MAP[input.period] ?? "TODAY";
  const visibility = VIS_MAP[input.visibility] ?? "PRIVATE";
  const profile = await ensureProfile(userId);
  const count = await db.diaryTask.count({ where: { userId, period } });

  const recurrenceMap: Record<string, "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"> = {
    daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY",
  };

  const created: DiaryTaskDto[] = [];
  for (let i = 0; i < lines.length; i++) {
    const row = await db.diaryTask.create({
      data: {
        userId,
        title: lines[i],
        note: input.note?.trim() || null,
        period,
        visibility,
        hashtag: input.hashtag?.trim() || null,
        hashtagColor: input.hashtagColor?.trim() || null,
        sortOrder: count + i,
        dueDate: input.dueDate ? new Date(input.dueDate) : input.scheduledAt ? new Date(input.scheduledAt) : null,
        hasTime: input.hasTime ?? false,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        isRecurring: input.isRecurring ?? false,
        recurrence: input.isRecurring ? recurrenceMap[input.recurrence ?? "daily"] : null,
        trackStreak: input.trackStreak ?? false,
        priority: input.priority ?? false,
        askProof: input.askProof ?? false,
        reminderAt: input.reminderAt ? new Date(input.reminderAt) : null,
        checklistJson: JSON.stringify(
          (input.checklist ?? []).map((text) => ({ text, done: false })),
        ),
      },
    });
    created.push({
      id: row.id,
      text: row.title,
      note: row.note ?? undefined,
      tag: row.hashtag ?? undefined,
      visibility: toClientVis(row.visibility),
      done: false,
      dueDate: row.dueDate?.toISOString(),
      hasTime: row.hasTime || undefined,
      scheduledAt: row.scheduledAt?.toISOString(),
      isRecurring: row.isRecurring,
      checklist: row.checklistJson !== "[]" ? row.checklistJson : undefined,
      reminderAt: row.reminderAt?.toISOString(),
      hashtagColor: row.hashtagColor ?? undefined,
      priority: row.priority || undefined,
      askProof: row.askProof || undefined,
    });
  }

  await db.userProfile.update({
    where: { userId },
    data: { tasksCreated: profile.tasksCreated + lines.length },
  });

  if (visibility !== "PRIVATE") {
    await db.activity.create({
      data: {
        userId,
        type: "TASK_CREATED",
        visibility,
        title: lines[0],
      },
    });
  }

  try {
    await checkAchievements(userId, {
      tasksCompleted: profile.tasksCompleted,
      tasksCreated: profile.tasksCreated + lines.length,
      level: profile.level,
    });
  } catch {
    // не блокируем создание задачи
  }

  return created;
}

export async function updateDiaryTaskForUser(
  userId: string,
  taskId: string,
  input: {
    text?: string;
    note?: string;
    period?: string;
    visibility?: string;
    hashtag?: string;
    hashtagColor?: string;
    trackStreak?: boolean;
    isRecurring?: boolean;
    recurrence?: string;
    dueDate?: string | null;
    reminderAt?: string | null;
    priority?: boolean;
    askProof?: boolean;
    hasTime?: boolean;
    scheduledAt?: string | null;
  },
) {
  const task = await db.diaryTask.findFirst({ where: { id: taskId, userId } });
  if (!task) return null;

  const recurrenceMap: Record<string, "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"> = {
    daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY",
  };

  const row = await db.diaryTask.update({
    where: { id: taskId },
    data: {
      ...(input.text != null ? { title: input.text.trim() } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      ...(input.period != null ? { period: PERIOD_MAP[input.period] ?? task.period } : {}),
      ...(input.visibility != null ? { visibility: VIS_MAP[input.visibility] ?? task.visibility } : {}),
      ...(input.hashtag !== undefined ? { hashtag: input.hashtag?.trim() || null } : {}),
      ...(input.hashtagColor !== undefined ? { hashtagColor: input.hashtagColor?.trim() || null } : {}),
      ...(input.trackStreak !== undefined ? { trackStreak: input.trackStreak } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.askProof !== undefined ? { askProof: input.askProof } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      ...(input.hasTime !== undefined ? { hasTime: input.hasTime } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null } : {}),
      ...(input.reminderAt !== undefined ? { reminderAt: input.reminderAt ? new Date(input.reminderAt) : null } : {}),
      ...(input.isRecurring !== undefined
        ? {
            isRecurring: input.isRecurring,
            recurrence: input.isRecurring ? recurrenceMap[input.recurrence ?? "daily"] ?? "DAILY" : null,
          }
        : {}),
    },
  });

  return {
    id: row.id,
    text: row.title,
    note: row.note ?? undefined,
    tag: row.hashtag ?? undefined,
    visibility: toClientVis(row.visibility),
    done: row.done,
    dueDate: row.dueDate?.toISOString(),
    hasTime: row.hasTime || undefined,
    scheduledAt: row.scheduledAt?.toISOString(),
    isRecurring: row.isRecurring,
    reminderAt: row.reminderAt?.toISOString(),
    hashtagColor: row.hashtagColor ?? undefined,
    priority: row.priority || undefined,
    askProof: row.askProof || undefined,
  } satisfies DiaryTaskDto;
}

export async function createDiaryTaskAction(input: {
  text: string;
  note?: string;
  period: string;
  visibility: string;
  hashtag?: string;
  dueDate?: string;
  isRecurring?: boolean;
  recurrence?: string;
  trackStreak?: boolean;
  reminderAt?: string;
  checklist?: string[];
  multiLine?: boolean;
  hashtagColor?: string;
  priority?: boolean;
  askProof?: boolean;
  hasTime?: boolean;
  scheduledAt?: string;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const created = await createDiaryTaskForUser(session.id, input);
  if (created.length) {
    revalidatePath(`/profile/${session.username}`);
    revalidatePath("/friends");
  }
  return created;
}

export async function reorderDiaryTasksForUser(userId: string, period: string, orderedIds: string[]) {
  const p = PERIOD_MAP[period] ?? "TODAY";
  await Promise.all(
    orderedIds.map((id, sortOrder) =>
      db.diaryTask.updateMany({
        where: { id, userId, period: p },
        data: { sortOrder },
      }),
    ),
  );
}

export async function reorderTasksAction(period: string, orderedIds: string[]) {
  const session = await getSession();
  if (!session) redirect("/login");

  await reorderDiaryTasksForUser(session.id, period, orderedIds);
  revalidatePath(`/profile/${session.username}`);
}

export async function getCalendarData(
  userId: string,
  year?: number,
  month?: number,
  tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES,
) {
  const now = new Date();
  const local = userLocalParts(now, tzOffsetMinutes);
  const y = year ?? local.year;
  const m = month ?? local.month;
  const start = new Date(Date.UTC(y, m, 1) - tzOffsetMinutes * 60_000);
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59) - tzOffsetMinutes * 60_000);

  const tasks = await db.diaryTask.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const todayKey = userDayKey(now, tzOffsetMinutes);
  const tomorrowKey = userDayKey(addUserLocalDays(now, tzOffsetMinutes, 1), tzOffsetMinutes);

  function resolveTaskDate(task: (typeof tasks)[0]): string {
    if (task.doneAt) return userDayKey(task.doneAt, tzOffsetMinutes);
    if (task.dueDate) return task.dueDate.toISOString().slice(0, 10);
    if (task.period === "TODAY") return todayKey;
    if (task.period === "TOMORROW") return tomorrowKey;
    if (task.period === "WEEK" || task.period === "MONTH" || task.period === "YEAR") return todayKey;
    return userDayKey(task.createdAt, tzOffsetMinutes);
  }

  const days: Record<string, {
    tasks: typeof tasks;
    hasDone: boolean;
    tags: string[];
    birthdays: string[];
    events: PersonalEventDto[];
  }> = {};
  for (const t of tasks) {
    const d = resolveTaskDate(t);
    const taskDate = new Date(`${d}T12:00:00`);
    if (taskDate < start || taskDate > end) continue;
    if (!days[d]) days[d] = { tasks: [], hasDone: false, tags: [], birthdays: [], events: [] };
    days[d].tasks.push(t);
    if (t.done) days[d].hasDone = true;
    if (t.hashtag) days[d].tags.push(t.hashtag);
  }

  const wishlists = await db.wishlist.findMany({
    where: { userId, eventAt: { gte: start, lte: end } },
    select: { title: true, eventAt: true, occasion: true },
  });
  for (const w of wishlists) {
    if (!w.eventAt) continue;
    const d = w.eventAt.toISOString().slice(0, 10);
    if (!days[d]) days[d] = { tasks: [], hasDone: false, tags: [], birthdays: [], events: [] };
    days[d].birthdays.push(w.occasion ? `${w.title} · ${w.occasion}` : w.title);
  }

  const personalEvents = await db.personalCalendarEvent.findMany({
    where: { userId, eventDate: { gte: start, lte: end } },
    orderBy: [{ eventDate: "asc" }, { scheduledAt: "asc" }],
  });
  for (const ev of personalEvents) {
    const d = ev.eventDate.toISOString().slice(0, 10);
    if (!days[d]) days[d] = { tasks: [], hasDone: false, tags: [], birthdays: [], events: [] };
    days[d].events.push({
      id: ev.id,
      title: ev.title,
      eventType: ev.eventType.toLowerCase(),
      eventDate: d,
      hasTime: ev.hasTime,
      scheduledAt: ev.scheduledAt?.toISOString(),
      isRecurring: ev.isRecurring,
      reminderAt: ev.reminderAt?.toISOString(),
      visibility: toClientVis(ev.visibility),
      note: ev.note ?? undefined,
    });
  }

  return { year: y, month: m, days };
}

export async function fetchCalendarAction(year: number, month: number, tzOffset?: number) {
  const session = await getSession();
  if (!session) return null;
  return getCalendarData(session.id, year, month, tzOffset ?? DEFAULT_TZ_OFFSET_MINUTES);
}

const EVENT_TYPE_MAP: Record<string, "BIRTHDAY" | "ANNIVERSARY" | "HOLIDAY" | "PAYMENT" | "MEETING" | "APPOINTMENT" | "HOUSEHOLD" | "CUSTOM"> = {
  birthday: "BIRTHDAY",
  anniversary: "ANNIVERSARY",
  holiday: "HOLIDAY",
  payment: "PAYMENT",
  meeting: "MEETING",
  appointment: "APPOINTMENT",
  household: "HOUSEHOLD",
  custom: "CUSTOM",
};

export async function createPersonalEventForUser(
  userId: string,
  input: {
    title: string;
    eventType?: string;
    eventDate: string;
    hasTime?: boolean;
    scheduledAt?: string;
    isRecurring?: boolean;
    recurrence?: string;
    reminderAt?: string;
    visibility?: string;
    note?: string;
  },
) {
  const title = input.title.trim();
  if (!title) return null;
  const recurrenceMap: Record<string, "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"> = {
    daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY",
  };
  const eventType = EVENT_TYPE_MAP[input.eventType?.toLowerCase() ?? "custom"] ?? "CUSTOM";
  const visibility = VIS_MAP[input.visibility ?? "private"] ?? "PRIVATE";
  const eventDate = new Date(`${input.eventDate}T12:00:00`);

  const row = await db.personalCalendarEvent.create({
    data: {
      userId,
      title,
      eventType,
      eventDate,
      hasTime: input.hasTime ?? false,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      isRecurring: input.isRecurring ?? false,
      recurrence: input.isRecurring ? recurrenceMap[input.recurrence ?? "yearly"] : null,
      reminderAt: input.reminderAt ? new Date(input.reminderAt) : null,
      visibility,
      note: input.note?.trim() || null,
    },
  });

  return {
    id: row.id,
    title: row.title,
    eventType: row.eventType.toLowerCase(),
    eventDate: input.eventDate,
    hasTime: row.hasTime,
    scheduledAt: row.scheduledAt?.toISOString(),
    visibility: toClientVis(row.visibility),
    note: row.note ?? undefined,
  } satisfies PersonalEventDto;
}

export async function createPersonalEventAction(input: {
  title: string;
  eventType?: string;
  eventDate: string;
  hasTime?: boolean;
  scheduledAt?: string;
  isRecurring?: boolean;
  recurrence?: string;
  reminderAt?: string;
  visibility?: string;
  note?: string;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const created = await createPersonalEventForUser(session.id, input);
  if (!created) return null;
  revalidatePath(`/profile/${session.username}`);
  return created;
}

export async function deletePersonalEventAction(eventId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  await db.personalCalendarEvent.deleteMany({ where: { id: eventId, userId: session.id } });
  revalidatePath(`/profile/${session.username}`);
}

export async function createChallengeFromTaskAction(taskId: string, input: {
  deadline?: string;
  radiusKm?: number;
  reward?: string;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const task = await db.diaryTask.findFirst({
    where: { id: taskId, userId: session.id, visibility: "PUBLIC" },
  });
  if (!task) return;

  const post = await db.post.create({
    data: {
      type: "CHALLENGE",
      authorId: session.id,
      title: task.title,
      content: task.note ?? task.title,
      city: session.city,
      district: session.district,
      lat: session.lat,
      lng: session.lng,
      radiusKm: input.radiusKm ?? 5,
      tags: task.hashtag ?? "",
      challenge: {
        create: {
          goalCount: 1,
          deadline: input.deadline ? new Date(input.deadline) : null,
          reward: input.reward?.trim() || null,
        },
      },
    },
  });

  await db.activity.create({
    data: {
      userId: session.id,
      type: "CHALLENGE_CREATED",
      visibility: "PUBLIC",
      title: task.title,
      postId: post.id,
    },
  });

  revalidatePath("/");
  revalidatePath(`/profile/${session.username}`);
  redirect(`/post/${post.id}`);
}

export async function copyTaskToDiaryAction(sourceTaskId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const source = await db.diaryTask.findUnique({ where: { id: sourceTaskId } });
  if (!source || source.visibility !== "PUBLIC") return;

  const exists = await db.taskCopy.findUnique({
    where: { sourceTaskId_userId: { sourceTaskId, userId: session.id } },
  });
  if (exists) return;

  await db.$transaction([
    db.diaryTask.create({
      data: {
        userId: session.id,
        title: source.title,
        note: source.note,
        period: "TODAY",
        visibility: "PRIVATE",
        sourceTaskId,
        hashtag: source.hashtag,
        hashtagColor: source.hashtagColor,
      },
    }),
    db.taskCopy.create({ data: { sourceTaskId, userId: session.id } }),
    db.diaryTask.update({
      where: { id: sourceTaskId },
      data: { copyCount: { increment: 1 } },
    }),
  ]);

  revalidatePath(`/profile/${session.username}`);
  revalidatePath("/friends");
}

export async function copyPostToDiaryAction(postId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return;

  await db.diaryTask.create({
    data: {
      userId: session.id,
      title: post.title ?? post.content.slice(0, 120),
      note: post.content,
      period: "TODAY",
      visibility: "PRIVATE",
      hashtag: parseTags(post.tags)[0] ?? null,
    },
  });

  revalidatePath(`/profile/${session.username}`);
}

export async function getDuelsForUser(userId: string) {
  const { listDuelsForUser } = await import("@/lib/duel-service");
  return listDuelsForUser(userId);
}

export async function getWishlistsForUser(userId: string, viewerId?: string, viewerUsername?: string) {
  const { listWishlistsForViewer } = await import("@/lib/wishlist-service");
  const viewer = viewerId ?? userId;
  return listWishlistsForViewer(userId, viewer, viewerUsername);
}

export async function getMediaForUser(userId: string) {
  return db.mediaItem.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPrivacyForUser(userId: string) {
  return db.privacySettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function updatePrivacyAction(data: {
  defaultDiary: string;
  defaultWishlist: string;
  defaultMedia: string;
  defaultEvents?: string;
  diaryScope: string;
  friendRequests: string;
  subscriptions?: string;
  profileInSearch: boolean;
  locationPrecision: string;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  await db.privacySettings.upsert({
    where: { userId: session.id },
    create: {
      userId: session.id,
      defaultDiary: (VIS_MAP[data.defaultDiary] ?? "PRIVATE") as Visibility,
      defaultWishlist: (VIS_MAP[data.defaultWishlist] ?? "FRIENDS") as Visibility,
      defaultMedia: (VIS_MAP[data.defaultMedia] ?? "PUBLIC") as Visibility,
      defaultEvents: (VIS_MAP[data.defaultEvents ?? "friends"] ?? "FRIENDS") as Visibility,
      diaryScope: data.diaryScope,
      friendRequests: data.friendRequests,
      subscriptions: data.subscriptions ?? "everyone",
      profileInSearch: data.profileInSearch,
      locationPrecision: data.locationPrecision,
    },
    update: {
      defaultDiary: (VIS_MAP[data.defaultDiary] ?? "PRIVATE") as Visibility,
      defaultWishlist: (VIS_MAP[data.defaultWishlist] ?? "FRIENDS") as Visibility,
      defaultMedia: (VIS_MAP[data.defaultMedia] ?? "PUBLIC") as Visibility,
      ...(data.defaultEvents ? { defaultEvents: (VIS_MAP[data.defaultEvents] ?? "FRIENDS") as Visibility } : {}),
      diaryScope: data.diaryScope,
      friendRequests: data.friendRequests,
      ...(data.subscriptions ? { subscriptions: data.subscriptions } : {}),
      profileInSearch: data.profileInSearch,
      locationPrecision: data.locationPrecision,
    },
  });

  revalidatePath(`/profile/${session.username}`);
}

export async function toggleChecklistItemForUser(
  userId: string,
  taskId: string,
  index: number,
) {
  const task = await db.diaryTask.findFirst({ where: { id: taskId, userId } });
  if (!task) return null;
  const items = parseChecklistJson(task.checklistJson);
  if (index < 0 || index >= items.length) return items;
  items[index] = { ...items[index], done: !items[index].done };
  await db.diaryTask.update({
    where: { id: taskId },
    data: { checklistJson: JSON.stringify(items) },
  });
  return items;
}

export async function updatePrivacyForUser(
  userId: string,
  data: {
    defaultDiary?: string;
    defaultWishlist?: string;
    defaultMedia?: string;
    defaultEvents?: string;
    locationPrecision?: string;
    profileInSearch?: boolean;
    diaryScope?: string;
    friendRequests?: string;
    subscriptions?: string;
  },
) {
  const row = await db.privacySettings.upsert({
    where: { userId },
    create: {
      userId,
      ...(data.defaultDiary ? { defaultDiary: (VIS_MAP[data.defaultDiary] ?? "PRIVATE") as Visibility } : {}),
      ...(data.defaultWishlist ? { defaultWishlist: (VIS_MAP[data.defaultWishlist] ?? "FRIENDS") as Visibility } : {}),
      ...(data.defaultMedia ? { defaultMedia: (VIS_MAP[data.defaultMedia] ?? "PUBLIC") as Visibility } : {}),
      ...(data.defaultEvents ? { defaultEvents: (VIS_MAP[data.defaultEvents] ?? "FRIENDS") as Visibility } : {}),
      ...(data.locationPrecision ? { locationPrecision: data.locationPrecision } : {}),
      ...(data.profileInSearch != null ? { profileInSearch: data.profileInSearch } : {}),
      ...(data.diaryScope ? { diaryScope: data.diaryScope } : {}),
      ...(data.friendRequests ? { friendRequests: data.friendRequests } : {}),
      ...(data.subscriptions ? { subscriptions: data.subscriptions } : {}),
    },
    update: {
      ...(data.defaultDiary ? { defaultDiary: (VIS_MAP[data.defaultDiary] ?? "PRIVATE") as Visibility } : {}),
      ...(data.defaultWishlist ? { defaultWishlist: (VIS_MAP[data.defaultWishlist] ?? "FRIENDS") as Visibility } : {}),
      ...(data.defaultMedia ? { defaultMedia: (VIS_MAP[data.defaultMedia] ?? "PUBLIC") as Visibility } : {}),
      ...(data.defaultEvents ? { defaultEvents: (VIS_MAP[data.defaultEvents] ?? "FRIENDS") as Visibility } : {}),
      ...(data.locationPrecision ? { locationPrecision: data.locationPrecision } : {}),
      ...(data.profileInSearch != null ? { profileInSearch: data.profileInSearch } : {}),
      ...(data.diaryScope ? { diaryScope: data.diaryScope } : {}),
      ...(data.friendRequests ? { friendRequests: data.friendRequests } : {}),
      ...(data.subscriptions ? { subscriptions: data.subscriptions } : {}),
    },
  });
  return privacyToClient(row);
}

export async function followDistrictForUser(
  userId: string,
  district: string,
  city: string,
) {
  await db.districtFollow.upsert({
    where: { userId_district_city: { userId, district, city } },
    create: { userId, district, city },
    update: {},
  });
  return { district, city };
}

export async function unfollowDistrictForUser(
  userId: string,
  district: string,
  city: string,
) {
  await db.districtFollow.deleteMany({ where: { userId, district, city } });
  return { ok: true };
}

export async function getFriendsFeed(
  userId: string,
  city?: string,
  type?: PostType | "ALL",
  view: "feed" | "duels" | "together" = "feed",
) {
  const friendRows = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
  const friendIds = friendRows.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );

  const follows = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followIds = follows.map((f) => f.followingId);
  const authorIds = [...new Set([...friendIds, ...followIds])];

  const activityTypes =
    view === "duels"
      ? (["DUEL_MARKED", "CHALLENGE_JOINED"] as const)
      : view === "together"
        ? (["CHALLENGE_CREATED", "TASK_COMPLETED", "EVENT_ATTENDED"] as const)
        : null;

  const friendIdSet = new Set(friendIds);

  const [activitiesRaw, posts] = await Promise.all([
    authorIds.length
      ? db.activity.findMany({
          where: {
            userId: { in: authorIds },
            ...(activityTypes ? { type: { in: [...activityTypes] } } : {}),
          },
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true, verified: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 120,
        })
      : [],
    authorIds.length
      ? db.post.findMany({
          where: {
            authorId: { in: authorIds },
            ...(type && type !== "ALL" ? { type } : {}),
            ...(view === "duels" ? { type: "CHALLENGE" as PostType } : {}),
            ...(view === "together" ? { OR: [{ type: "CHALLENGE" }, { type: "ANNOUNCEMENT" }] } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            author: {
              select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true },
            },
            challenge: {
              include: {
                participants: { select: { id: true } },
                _count: { select: { participants: true, reports: true } },
              },
            },
            _count: { select: { likes: true, comments: true, going: true, reposts: true } },
            likes: { where: { userId }, select: { id: true } },
            going: { where: { userId }, select: { id: true } },
          },
        })
      : [],
  ]);

  const privacyMap = await loadPrivacyByUserIds(activitiesRaw.map((a) => a.userId));
  const activities = activitiesRaw
    .filter((a) =>
      canViewerSeeActivity(
        userId,
        a.userId,
        a.visibility,
        a.type,
        friendIdSet.has(a.userId),
        privacyMap.get(a.userId),
      ),
    )
    .slice(0, 40)
    .map(sanitizeActivityForViewer);

  return { activities, posts };
}

export async function getCuratedFeed(city: string, userId?: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cities = resolveContentCities(city);

  const [featuredPosts, hotChallenges, recentAchievements, localEvents, businessChallenges, followingChallenges] = await Promise.all([
    db.post.findMany({
      where: {
        hiddenFromFeed: false,
        OR: [
          { featuredInFeed: true },
          { tags: { contains: "sponsored" } },
          { city: { in: cities }, featuredInFeed: true },
        ],
      },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true } },
        challenge: { include: { _count: { select: { participants: true } } } },
        _count: { select: { likes: true, comments: true, going: true, reposts: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        going: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: [{ featuredBoost: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.challenge.findMany({
      where: {
        participants: { some: {} },
        OR: [
          { post: { city: { in: cities }, hiddenFromFeed: false } },
          { isGlobal: true, post: { hiddenFromFeed: false } },
          { post: { tags: { contains: "sponsored" }, hiddenFromFeed: false } },
        ],
      },
      include: {
        post: {
          select: {
            id: true, title: true, content: true, city: true, district: true, type: true, tags: true, createdAt: true, images: true, featuredInFeed: true, contactInfo: true,
            author: { select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true } },
          },
        },
        _count: { select: { participants: true } },
      },
      orderBy: { participants: { _count: "desc" } },
      take: 8,
    }),
    db.activity.findMany({
      where: { type: "ACHIEVEMENT_UNLOCKED", visibility: "PUBLIC", createdAt: { gte: weekAgo } },
      include: { user: { select: { name: true, username: true, avatar: true, verified: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.post.findMany({
      where: {
        type: "ANNOUNCEMENT",
        hiddenFromFeed: false,
        createdAt: { gte: weekAgo },
        OR: [
          { city: { in: cities } },
          { tags: { contains: "sponsored" } },
          { featuredInFeed: true },
        ],
      },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true } },
        _count: { select: { likes: true, comments: true, going: true, reposts: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        going: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { going: { _count: "desc" } },
      take: 5,
    }),
    db.challenge.findMany({
      where: {
        isBusiness: true,
        OR: [
          { post: { city: { in: cities } } },
          { post: { tags: { contains: "sponsored" } } },
          { post: { featuredInFeed: true } },
        ],
      },
      include: {
        post: {
          select: {
            id: true, title: true, content: true, city: true, district: true, type: true, tags: true, createdAt: true,
            author: { select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true } },
          },
        },
        _count: { select: { participants: true } },
      },
      take: 5,
    }),
    userId
      ? db.post.findMany({
          where: {
            type: "CHALLENGE",
            hiddenFromFeed: false,
            authorId: { in: (await db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })).map((f) => f.followingId) },
            createdAt: { gte: weekAgo },
          },
          include: {
            author: { select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true } },
            challenge: { include: { _count: { select: { participants: true } } } },
            _count: { select: { likes: true, comments: true, going: true, reposts: true } },
            likes: { where: { userId }, select: { id: true } },
            going: { where: { userId }, select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [],
  ]);

  type CuratedItem =
    | { kind: "post"; post: (typeof localEvents)[0]; score: number }
    | { kind: "achievement"; activity: (typeof recentAchievements)[0]; score: number }
    | { kind: "digest"; score: number };

  const items: CuratedItem[] = [];

  for (const fp of featuredPosts) {
    items.push({ kind: "post", post: fp, score: 200 + fp.featuredBoost });
  }
  for (const ch of hotChallenges) {
    if (!ch.post) continue;
    const post = {
      ...ch.post,
      tags: ch.post.tags ?? "",
      type: "CHALLENGE" as const,
      challenge: { ...ch, participants: [], _count: { reports: 0, participants: ch._count.participants } },
      _count: { likes: 0, comments: 0, going: 0, reposts: 0 },
      likes: [],
      going: [],
    };
    items.push({ kind: "post", post: post as unknown as (typeof localEvents)[0], score: ch._count.participants * 10 });
  }
  for (const ev of localEvents) {
    items.push({ kind: "post", post: ev, score: ev._count.going * 8 + ev._count.likes * 2 });
  }
  for (const ach of recentAchievements) {
    items.push({ kind: "achievement", activity: ach, score: 50 });
  }
  for (const p of followingChallenges) {
    items.push({ kind: "post", post: p as unknown as (typeof localEvents)[0], score: 40 });
  }
  for (const b of businessChallenges) {
    if (!b.post) continue;
    const post = {
      ...b.post,
      tags: b.post.tags ?? "",
      type: "CHALLENGE" as const,
      challenge: { ...b, participants: [], _count: { reports: 0, participants: b._count.participants } },
      _count: { likes: 0, comments: 0, going: 0, reposts: 0 },
      likes: [],
      going: [],
    };
    items.push({ kind: "post", post: post as unknown as (typeof localEvents)[0], score: 35 });
  }

  const postById = new Map<string, Extract<CuratedItem, { kind: "post" }>>();
  const mergedItems: CuratedItem[] = [];
  for (const item of items) {
    if (item.kind === "post") {
      const prev = postById.get(item.post.id);
      if (!prev || item.score > prev.score) postById.set(item.post.id, item);
    } else {
      mergedItems.push(item);
    }
  }
  mergedItems.push(...postById.values());
  mergedItems.sort((a, b) => b.score - a.score);

  const [cityUsers, districtUsers, friendActivity, activeDuels, topLevel] = await Promise.all([
    db.user.count({ where: { city: { in: cities } } }),
    db.user.count({ where: { city: { in: cities }, district: { not: null } } }),
    userId
      ? db.activity.count({
          where: {
            userId: { in: (await db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })).map((f) => f.followingId) },
            createdAt: { gte: weekAgo },
          },
        })
      : Promise.resolve(0),
    db.duel.findMany({
      where: { visibility: { in: ["PUBLIC", "FRIENDS"] } },
      include: {
        creator: { select: { name: true, username: true, avatar: true } },
        participants: { include: { user: { select: { name: true, username: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.userProfile.findMany({
      orderBy: { level: "desc" },
      take: 1,
      include: { user: { select: { name: true, username: true, avatar: true, city: true } } },
    }),
  ]);

  const stepSum = hotChallenges.reduce((s, c) => s + c._count.participants, 0);
  const digest = {
    challengeCount: hotChallenges.length,
    city,
    weekLabel: "за неделю",
    scopes: {
      city: {
        label: city,
        headline: `${hotChallenges.length} челленджей · ${stepSum} участников`,
        body: `${cityUsers} человек в движе. События и спонсорские челленджи рядом с тобой.`,
        stats: [
          { value: String(hotChallenges.length), label: "челленджей" },
          { value: String(localEvents.length), label: "событий" },
        ],
      },
      district: {
        label: "Район",
        headline: `Локальный дайджест · ${city}`,
        body: "Активность в твоём районе — встречи, пробежки и микро-челленджи от соседей.",
        stats: [
          { value: String(districtUsers), label: "в районе" },
          { value: String(businessChallenges.length), label: "спонсоров" },
        ],
      },
      friends: {
        label: "Друзья",
        headline: friendActivity ? `${friendActivity} действий за неделю` : "Подпишись — увидишь движ",
        body: "Стрики, споры и челленджи людей, на которых ты подписан.",
        stats: [
          { value: String(followingChallenges.length), label: "челленджей" },
          { value: String(recentAchievements.length), label: "ачивок" },
        ],
      },
    },
  };

  type FeedHighlight =
    | { kind: "milestone"; name: string; username: string; avatar: string | null; level: number; title: string }
    | { kind: "sponsor"; brand: string; reward: string; participants: number; postId: string; title: string }
    | { kind: "duel"; title: string; emoji: string | null; participants: string[]; id: string }
    | { kind: "challenge_stat"; stat: string; label: string; postId: string; title: string };

  const highlights: FeedHighlight[] = [];

  const top = topLevel[0];
  if (top) {
    highlights.push({
      kind: "milestone",
      name: top.user.name ?? top.user.username,
      username: top.user.username,
      avatar: top.user.avatar,
      level: top.level,
      title: `Достиг уровня ${top.level}`,
    });
  }

  for (const b of businessChallenges.slice(0, 2)) {
    if (!b.post) continue;
    highlights.push({
      kind: "sponsor",
      brand: b.post.title?.slice(0, 24) ?? "Спонсор",
      reward: b.reward ?? "Приз",
      participants: b._count.participants,
      postId: b.post.id,
      title: b.post.title ?? b.post.content.slice(0, 80),
    });
  }

  for (const d of activeDuels.slice(0, 2)) {
    highlights.push({
      kind: "duel",
      id: d.id,
      title: d.title,
      emoji: d.emoji,
      participants: d.participants.map((p) => p.user.name ?? p.user.username),
    });
  }

  if (hotChallenges[0]?.post) {
    highlights.push({
      kind: "challenge_stat",
      stat: String(hotChallenges[0]._count.participants),
      label: "участников в топ-челлендже",
      postId: hotChallenges[0].post.id,
      title: hotChallenges[0].post.title ?? hotChallenges[0].post.content.slice(0, 60),
    });
  }

  const normalizedItems = mergedItems.map((item) => {
    if (item.kind !== "post") return item;
    return {
      ...item,
      post: {
        ...item.post,
        images: normalizePostImages(item.post.images),
      },
    };
  });

  return { items: normalizedItems, digest, highlights };
}
