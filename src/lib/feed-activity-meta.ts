import type { ActivityType } from "@prisma/client";

export type FeedActivityMeta = {
  label: string;
  act: string;
  actionHref?: (ctx: { username: string; postId?: string | null; taskId?: string | null }) => string | null;
  actionLabel?: string;
  secondaryActionLabel?: string;
};

export const FEED_ACTIVITY_META: Record<ActivityType, FeedActivityMeta> = {
  TASK_COMPLETED: {
    label: "Дневник",
    act: "выполнил задачу",
    actionLabel: "Забрать себе",
  },
  TASK_CREATED: {
    label: "Задача",
    act: "создал задачу",
    actionLabel: "Повторить",
  },
  TASK_PROOF: {
    label: "Пруф",
    act: "добавил фото-пруф",
    actionLabel: "Забрать себе",
  },
  CHALLENGE_JOINED: {
    label: "Челлендж",
    act: "вступил в вызов",
    actionHref: () => "/challenges",
    actionLabel: "Вступить",
  },
  CHALLENGE_CREATED: {
    label: "Челлендж",
    act: "запустил вызов",
    actionHref: () => "/challenges",
    actionLabel: "Открыть",
  },
  ACHIEVEMENT_UNLOCKED: {
    label: "Ачивка",
    act: "получил ачивку",
    actionHref: ({ username }) => `/profile/${username}?view=achievements`,
    actionLabel: "Открыть",
  },
  EVENT_ATTENDED: {
    label: "Событие",
    act: "посетил событие",
    actionHref: () => "/nearby",
    actionLabel: "Пойти",
  },
  DUEL_MARKED: {
    label: "Спор",
    act: "отметился в споре",
    actionHref: () => "/friends?view=duels",
    actionLabel: "Открыть",
  },
  DUEL_STARTED: {
    label: "Спор",
    act: "запустил спор",
    actionHref: () => "/friends?view=duels",
    actionLabel: "Открыть",
  },
  MEDIA_ADDED: {
    label: "Медиалист",
    act: "добавил в медиалист",
    actionHref: ({ username }) => `/profile/${username}?view=media`,
    actionLabel: "Забрать себе",
  },
  WISHLIST_ADDED: {
    label: "Вишлист",
    act: "обновил вишлист",
    actionHref: ({ username }) => `/profile/${username}?view=wishlist`,
    actionLabel: "Открыть",
  },
  SHARED_GOAL_UPDATED: {
    label: "Вместе",
    act: "отметил пункт в списке",
    actionHref: () => "/friends?view=together",
    actionLabel: "Открыть",
  },
};

export function getFeedActivityMeta(type: string): FeedActivityMeta {
  return FEED_ACTIVITY_META[type as ActivityType] ?? FEED_ACTIVITY_META.TASK_COMPLETED;
}
