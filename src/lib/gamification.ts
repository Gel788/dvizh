import type { DiaryPeriod } from "@prisma/client";

export const PERIOD_XP: Record<DiaryPeriod, number> = {
  TODAY: 10,
  TOMORROW: 10,
  WEEK: 25,
  MONTH: 50,
  YEAR: 120,
  DREAM: 200,
};

/** +5% XP за каждый день серии, потолок ×2 (как в прототипе) */
export function streakXpMultiplier(streak: number) {
  if (!streak) return 1;
  return Math.min(2, 1 + Math.min(streak, 20) * 0.05);
}

const LEVEL_NAMES: Record<number, string> = {
  1: "Только проснулся", 5: "Разогрев пошёл", 9: "Свой в подъезде", 13: "Свой на районе",
  14: "Утренний герой", 15: "Не сидит на месте", 16: "Заводила двора", 17: "Местная знаменитость",
  18: "Город в курсе", 19: "Мотор района", 20: "Движ-магнит", 21: "Тебя зовут везде",
  22: "Легенда соседнего двора", 30: "Пульс города", 45: "Совесть района", 60: "Город держится на тебе",
};

export function rankName(level: number) {
  if (LEVEL_NAMES[level]) return LEVEL_NAMES[level];
  let best = "Местный движ";
  for (let k = level; k >= 1; k--) {
    if (LEVEL_NAMES[k]) { best = LEVEL_NAMES[k]; break; }
  }
  return best;
}

export function xpForLevel(level: number) {
  return 100 + (level - 1) * 15;
}

export function levelFromXp(xp: number) {
  let lvl = 1;
  let rem = xp;
  while (lvl < 60) {
    const need = xpForLevel(lvl);
    if (rem >= need) { rem -= need; lvl++; } else break;
  }
  const need = xpForLevel(lvl);
  return { level: lvl, into: Math.round(rem), need, pct: Math.min(100, (rem / need) * 100) };
}

export function effectiveLevel(xp: number, storedLevel: number, levelUnlockedAt: Date) {
  const computed = levelFromXp(xp).level;
  if (computed <= 10) return computed;
  const weeksSince = (Date.now() - levelUnlockedAt.getTime()) / (7 * 24 * 60 * 60 * 1000);
  const maxByTime = 10 + Math.floor(weeksSince * 0.5);
  return Math.min(computed, Math.max(storedLevel, Math.min(maxByTime, computed)));
}

export const ACHIEVEMENT_DEFS = [
  { slug: "tasks-1", name: "Первый шаг", description: "Выполни 1 задачу", category: "tasks", icon: "👣", color: "#C8FF57", threshold: 1 },
  { slug: "tasks-5", name: "Разгон", description: "Выполни 5 задач", category: "tasks", icon: "⚡", color: "#C8FF57", threshold: 5 },
  { slug: "tasks-25", name: "Ритм", description: "Выполни 25 задач", category: "tasks", icon: "🔥", color: "#C8FF57", threshold: 25 },
  { slug: "tasks-100", name: "Машина продуктивности", description: "Выполни 100 задач", category: "tasks", icon: "🚀", color: "#C8FF57", threshold: 100 },
  { slug: "created-1", name: "Планировщик", description: "Создай первую задачу", category: "tasks", icon: "📝", color: "#7C5CFF", threshold: 1 },
  { slug: "streak-7", name: "Неделя в движе", description: "Стрик 7 дней", category: "streaks", icon: "🔥", color: "#FF2D55", threshold: 7 },
  { slug: "streak-30", name: "Месяц без пропусков", description: "Стрик 30 дней", category: "streaks", icon: "💎", color: "#FF2D55", threshold: 30 },
  { slug: "friend-1", name: "Первый друг", description: "Добавь друга", category: "social", icon: "🤝", color: "#00D9FF", threshold: 1 },
  { slug: "challenge-join", name: "В игре", description: "Вступи в челлендж", category: "social", icon: "🎯", color: "#7C5CFF", threshold: 1 },
  { slug: "challenge-create", name: "Организатор", description: "Создай челлендж", category: "social", icon: "🌍", color: "#7C5CFF", threshold: 1 },
  { slug: "level-10", name: "Десятка", description: "Достигни 10 уровня", category: "level", icon: "⭐", color: "#FFB020", threshold: 10 },
  { slug: "level-30", name: "Пульс города", description: "Достигни 30 уровня", category: "level", icon: "👑", color: "#FFB020", threshold: 30 },
] as const;
