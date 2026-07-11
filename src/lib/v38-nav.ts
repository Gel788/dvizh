/** v38 navigation — parity with Flutter `DvizhBottomNav` + scope tabs */

export const V38_MAIN_TABS = [
  { href: "/", label: "Лента", exact: true as const },
  { href: "/nearby", label: "События", exact: false as const },
  { href: "/today", label: "Сегодня", exact: false as const },
  { href: "/challenges", label: "Челленджи", exact: false as const },
  { href: "/profile", label: "Профиль", exact: false as const, profile: true as const },
] as const;

export const V38_QUICK_ITEMS = [
  { key: "calendar", label: "Календарь", href: "/today?view=calendar", emoji: "📅" },
  { key: "media", label: "Медиалист", href: "/media", emoji: "🎬" },
  { key: "wishlist", label: "Вишлист", href: "/wishlist", emoji: "🎁" },
  { key: "dispute", label: "Спор", href: "/friends?view=duels", emoji: "⚔️" },
  { key: "together", label: "Вместе", href: "/friends?view=together", emoji: "🤝" },
] as const;

export const V38_FEED_SCOPES = [
  { value: "friends", label: "Друзья" },
  { value: "nearby", label: "Рядом" },
  { value: "district", label: "Район" },
  { value: "city", label: "Город" },
  { value: "global", label: "Глобальное" },
] as const;

export const V38_MOVE_SCOPES = [
  { value: "friends", label: "Друзья" },
  { value: "nearby", label: "Рядом" },
  { value: "district", label: "Район" },
  { value: "city", label: "Город" },
  { value: "global", label: "Глобальное" },
] as const;

export const V38_CHALLENGE_SCOPES = [
  { value: "mine", label: "Я" },
  { value: "friends", label: "Друзья" },
  { value: "district", label: "Район" },
  { value: "city", label: "Город" },
  { value: "global", label: "Мир" },
] as const;

export type V38FeedScope = (typeof V38_FEED_SCOPES)[number]["value"];
export type V38MoveScope = (typeof V38_MOVE_SCOPES)[number]["value"];
export type V38ChallengeScope = (typeof V38_CHALLENGE_SCOPES)[number]["value"];

export function profileHref(username?: string) {
  return username ? `/profile/${username}` : "/login";
}
