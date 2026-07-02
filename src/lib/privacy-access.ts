import type { ActivityType, Visibility } from "@prisma/client";
import { db } from "@/lib/db";

/** Активности, связанные с дневником и ачивками */
export const DIARY_ACTIVITY_TYPES = new Set<ActivityType>([
  "TASK_COMPLETED",
  "TASK_CREATED",
  "ACHIEVEMENT_UNLOCKED",
]);

export type AuthorPrivacy = {
  diaryScope: string;
  defaultDiary: Visibility;
};

const DEFAULT_PRIVACY: AuthorPrivacy = {
  diaryScope: "public_only",
  defaultDiary: "PRIVATE",
};

/** Может ли зритель видеть активность автора с учётом настроек приватности */
export function canViewerSeeActivity(
  viewerId: string | undefined,
  authorId: string,
  activityVisibility: Visibility,
  activityType: ActivityType,
  isFriend: boolean,
  privacy?: AuthorPrivacy | null,
): boolean {
  if (viewerId === authorId) return true;
  if (activityVisibility === "PRIVATE") return false;

  const p = privacy ?? DEFAULT_PRIVACY;

  if (DIARY_ACTIVITY_TYPES.has(activityType)) {
    if (activityType === "ACHIEVEMENT_UNLOCKED" && p.defaultDiary === "PRIVATE") {
      return false;
    }
    if (p.diaryScope !== "full") {
      return activityVisibility === "PUBLIC";
    }
    if (activityVisibility === "PUBLIC") return true;
    if (activityVisibility === "FRIENDS") return isFriend;
    return false;
  }

  if (activityVisibility === "FRIENDS") return isFriend;
  return activityVisibility === "PUBLIC";
}

export async function loadPrivacyByUserIds(userIds: string[]): Promise<Map<string, AuthorPrivacy>> {
  const unique = [...new Set(userIds)];
  const map = new Map<string, AuthorPrivacy>();
  if (!unique.length) return map;

  const rows = await db.privacySettings.findMany({
    where: { userId: { in: unique } },
    select: { userId: true, diaryScope: true, defaultDiary: true },
  });

  for (const id of unique) {
    const row = rows.find((r) => r.userId === id);
    map.set(id, row ?? { ...DEFAULT_PRIVACY });
  }
  return map;
}

export async function diaryActivityVisibility(userId: string): Promise<Visibility> {
  const row = await db.privacySettings.findUnique({ where: { userId } });
  return row?.defaultDiary ?? "PRIVATE";
}

/** Не отдаём taskId для копирования, если задача не публичная */
export function sanitizeActivityForViewer<T extends { visibility: Visibility; type: ActivityType; taskId: string | null }>(
  activity: T,
): T {
  if (activity.type === "TASK_COMPLETED" && activity.visibility === "PUBLIC" && activity.taskId) {
    return activity;
  }
  return { ...activity, taskId: null };
}
