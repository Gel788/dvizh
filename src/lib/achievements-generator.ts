export type AchievementTemplate = {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  threshold: number;
  kind: "tasks" | "created" | "level" | "streak" | "theme" | "social" | "friends" | "challenge-join" | "challenge-create";
  theme?: string;
};

const TASK_THRESHOLDS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
const CREATED_THRESHOLDS = [1, 5, 10, 25, 50, 100];
const LEVEL_THRESHOLDS = [5, 10, 15, 20, 30, 40, 50, 60];
const STREAK_THRESHOLDS = [7, 14, 30, 60, 100];
const FRIEND_THRESHOLDS = [1, 3, 5, 10, 25, 50];

const THEMES: { key: string; label: string; icon: string; color: string; synonyms: string[] }[] = [
  { key: "sport", label: "Спорт", icon: "🏃", color: "#C8FF57", synonyms: ["бег", "спорт", "зал", "йога", "трениров"] },
  { key: "books", label: "Книги", icon: "📚", color: "#7C5CFF", synonyms: ["книг", "читать", "чтение"] },
  { key: "travel", label: "Путешествия", icon: "✈️", color: "#2D6BFF", synonyms: ["путешеств", "поездк", "отпуск"] },
  { key: "family", label: "Семья", icon: "👨‍👩‍👧", color: "#FF2D55", synonyms: ["семь", "мама", "папа", "родител"] },
  { key: "home", label: "Дом", icon: "🏠", color: "#00D9FF", synonyms: ["дом", "уборк", "готовк", "быт"] },
  { key: "health", label: "Здоровье", icon: "🧘", color: "#22B07D", synonyms: ["здоров", "медита", "сон", "вода"] },
  { key: "work", label: "Работа", icon: "💼", color: "#FFB020", synonyms: ["работ", "проект", "офис"] },
  { key: "finance", label: "Финансы", icon: "💰", color: "#FFB020", synonyms: ["финанс", "накоп", "бюджет"] },
  { key: "films", label: "Кино", icon: "🎬", color: "#7C5CFF", synonyms: ["фильм", "кино", "сериал"] },
  { key: "games", label: "Игры", icon: "🎮", color: "#FF2D55", synonyms: ["игр", "steam"] },
  { key: "social", label: "Сообщество", icon: "🤝", color: "#00D9FF", synonyms: ["друз", "встреч", "клуб"] },
  { key: "volunteer", label: "Волонтёрство", icon: "💚", color: "#22B07D", synonyms: ["волонт", "помощ"] },
  { key: "auto", label: "Авто", icon: "🚗", color: "#2D6BFF", synonyms: ["авто", "машин", "водител"] },
  { key: "garden", label: "Дача", icon: "🌱", color: "#22B07D", synonyms: ["дач", "сад", "огород"] },
  { key: "lang", label: "Языки", icon: "🗣️", color: "#7C5CFF", synonyms: ["язык", "англий", "испан"] },
];

const THEME_THRESHOLDS = [1, 5, 10, 30, 50, 100];

export function generateAchievementCatalog(): AchievementTemplate[] {
  const out: AchievementTemplate[] = [];

  for (const t of TASK_THRESHOLDS) {
    out.push({
      slug: `tasks-${t}`,
      name: t === 1 ? "Первый шаг" : `${t} задач`,
      description: `Выполни ${t} задач в дневнике`,
      category: "tasks",
      icon: t >= 100 ? "🚀" : t >= 25 ? "🔥" : "👣",
      color: "#C8FF57",
      threshold: t,
      kind: "tasks",
    });
  }

  for (const t of CREATED_THRESHOLDS) {
    out.push({
      slug: `created-${t}`,
      name: t === 1 ? "Планировщик" : `Создал ${t} задач`,
      description: `Создай ${t} задач`,
      category: "tasks",
      icon: "📝",
      color: "#7C5CFF",
      threshold: t,
      kind: "created",
    });
  }

  for (const t of LEVEL_THRESHOLDS) {
    out.push({
      slug: `level-${t}`,
      name: `Уровень ${t}`,
      description: `Достигни ${t} уровня`,
      category: "level",
      icon: t >= 30 ? "👑" : "⭐",
      color: "#FFB020",
      threshold: t,
      kind: "level",
    });
  }

  for (const t of STREAK_THRESHOLDS) {
    out.push({
      slug: `streak-${t}`,
      name: `Стрик ${t}`,
      description: `Поддержи серию ${t} дней`,
      category: "streaks",
      icon: "🔥",
      color: "#FF2D55",
      threshold: t,
      kind: "streak",
    });
  }

  for (const theme of THEMES) {
    for (const t of THEME_THRESHOLDS) {
      out.push({
        slug: `theme-${theme.key}-${t}`,
        name: `${theme.label}: ${t}`,
        description: `${t} задач по теме «${theme.label}»`,
        category: "themes",
        icon: theme.icon,
        color: theme.color,
        threshold: t,
        kind: "theme",
        theme: theme.key,
      });
    }
  }

  for (const t of FRIEND_THRESHOLDS) {
    out.push({
      slug: `friends-${t}`,
      name: t === 1 ? "Первый друг" : `${t} друзей`,
      description: `Имей ${t} друзей в ДВИЖ`,
      category: "social",
      icon: "🤝",
      color: "#00D9FF",
      threshold: t,
      kind: "friends",
    });
  }

  const social = [
    { slug: "challenge-join-1", name: "В игре", desc: "Вступи в челлендж", icon: "🎯", t: 1, kind: "challenge-join" as const },
    { slug: "challenge-join-5", name: "Челленджер", desc: "5 челленджей", icon: "🎯", t: 5, kind: "challenge-join" as const },
    { slug: "challenge-create-1", name: "Организатор", desc: "Создай челлендж", icon: "🌍", t: 1, kind: "challenge-create" as const },
    { slug: "challenge-create-3", name: "Лидер движа", desc: "3 челленджа", icon: "🌍", t: 3, kind: "challenge-create" as const },
    { slug: "duel-1", name: "Первый спор", desc: "Участвуй в поединке", icon: "⚔️", t: 1, kind: "social" as const },
    { slug: "wishlist-1", name: "Первый вишлист", desc: "Создай вишлист", icon: "🎁", t: 1, kind: "social" as const },
    { slug: "media-review-1", name: "Критик", desc: "Оставь рецензию", icon: "⭐", t: 1, kind: "social" as const },
    { slug: "mascot-1", name: "Первая эволюция", desc: "Эволюция маскота", icon: "🐣", t: 1, kind: "social" as const },
  ];

  for (const s of social) {
    out.push({
      slug: s.slug,
      name: s.name,
      description: s.desc,
      category: "social",
      icon: s.icon,
      color: "#7C5CFF",
      threshold: s.t,
      kind: s.kind,
    });
  }

  const MEDIA_THRESHOLDS = [1, 3, 5, 10, 15, 25, 40, 60, 80, 100];
  for (const t of MEDIA_THRESHOLDS) {
    out.push({
      slug: `media-done-${t}`,
      name: t === 1 ? "Первый отзыв" : `${t} в медиалисте`,
      description: `Заверши ${t} в медиалисте`,
      category: "social",
      icon: "🎬",
      color: "#7C5CFF",
      threshold: t,
      kind: "social",
    });
  }

  const DUEL_MARKS = [1, 3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
  for (const t of DUEL_MARKS) {
    out.push({
      slug: `duel-mark-${t}`,
      name: `Спор: ${t} отметок`,
      description: `Отметься в споре ${t} раз`,
      category: "social",
      icon: "⚔️",
      color: "#FF2D55",
      threshold: t,
      kind: "social",
    });
  }

  const EVENTS_ATTEND = [1, 3, 5, 10, 20, 35, 50];
  for (const t of EVENTS_ATTEND) {
    out.push({
      slug: `event-${t}`,
      name: t === 1 ? "Первый движ" : `${t} событий`,
      description: `Сходи на ${t} событий`,
      category: "social",
      icon: "📍",
      color: "#00D9FF",
      threshold: t,
      kind: "social",
    });
  }

  const HABITS = [
    { key: "water", label: "Вода", icon: "💧" },
    { key: "sleep", label: "Сон", icon: "😴" },
    { key: "walk", label: "Шаги", icon: "👟" },
    { key: "journal", label: "Дневник", icon: "📓" },
    { key: "cook", label: "Готовка", icon: "🍳" },
    { key: "music", label: "Музыка", icon: "🎵" },
    { key: "photo", label: "Фото", icon: "📷" },
    { key: "learn", label: "Учёба", icon: "🧠" },
  ];
  const HABIT_THRESHOLDS = [1, 5, 10, 25, 50, 100];
  for (const h of HABITS) {
    for (const t of HABIT_THRESHOLDS) {
      out.push({
        slug: `habit-${h.key}-${t}`,
        name: `${h.label}: ${t}`,
        description: `${t} дел по привычке «${h.label}»`,
        category: "themes",
        icon: h.icon,
        color: "#22B07D",
        threshold: t,
        kind: "theme",
        theme: h.key,
      });
    }
  }

  const DISTRICTS = ["center", "north", "south", "east", "west", "suburb"];
  for (const d of DISTRICTS) {
    for (const t of [1, 5, 10, 25]) {
      out.push({
        slug: `district-${d}-${t}`,
        name: `Район ${d}: ${t}`,
        description: `${t} дел в районе`,
        category: "social",
        icon: "🗺️",
        color: "#2D6BFF",
        threshold: t,
        kind: "social",
      });
    }
  }

  const WISHLIST_ITEMS = [1, 3, 5, 10, 20, 30];
  for (const t of WISHLIST_ITEMS) {
    out.push({
      slug: `wishlist-items-${t}`,
      name: `${t} желаний`,
      description: `Добавь ${t} пунктов в вишлист`,
      category: "social",
      icon: "🎁",
      color: "#22B07D",
      threshold: t,
      kind: "social",
    });
  }

  const TOGETHER = [1, 3, 5, 10, 20];
  for (const t of TOGETHER) {
    out.push({
      slug: `together-${t}`,
      name: `Вместе: ${t}`,
      description: `Закрой ${t} пунктов в общих списках`,
      category: "social",
      icon: "🤝",
      color: "#C8FF57",
      threshold: t,
      kind: "social",
    });
  }

  return out;
}

export { THEMES };
