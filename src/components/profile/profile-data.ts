export type DiaryPeriod = "today" | "tomorrow" | "week" | "month" | "year" | "dream";

export const PERIODS: Record<DiaryPeriod, { label: string; color: string; xp: number }> = {
  today:    { label: "Сегодня", color: "#C8FF57", xp: 10 },
  tomorrow: { label: "Завтра",  color: "#C8FF57", xp: 10 },
  week:     { label: "Неделя",  color: "#00D9FF", xp: 25 },
  month:    { label: "Месяц",   color: "#7C5CFF", xp: 50 },
  year:     { label: "Год",     color: "#2D6BFF", xp: 120 },
  dream:    { label: "Мечта",   color: "#FF2D55", xp: 200 },
};

export const TAG_SWATCHES = ["#C8FF57", "#FF2D55", "#FFB020", "#22B07D", "#00D9FF", "#2D6BFF", "#7C5CFF", "#FF3D9A"] as const;

export const CHECKLIST_PRESETS = ["Покупки", "Сборы", "Гости", "Подарки", "Своё"] as const;

export const TAG_COLORS: Record<string, string> = {
  спорт: "#C8FF57", семья: "#FF2D55", дом: "#00D9FF", книги: "#7C5CFF",
  здоровье: "#22B07D", работа: "#2D6BFF", финансы: "#FFB020", языки: "#7C5CFF",
  путешествия: "#2D6BFF", встречи: "#FF2D55",
};

export function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? "#7A7A8A";
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

export function levelInfo(xp: number) {
  let lvl = 1;
  let rem = xp;
  while (lvl < 60) {
    const need = 100 + (lvl - 1) * 15;
    if (rem >= need) { rem -= need; lvl++; } else break;
  }
  const need = 100 + (lvl - 1) * 15;
  return { level: lvl, into: Math.round(rem), need, pct: Math.min(100, (rem / need) * 100) };
}

export type DiaryTask = {
  id: string;
  text: string;
  tag?: string;
  streak?: number;
  checklist?: string;
  note?: string;
  visibility?: TaskVisibility;
  done: boolean;
  isRecurring?: boolean;
  dueDate?: string;
  reminderAt?: string;
  hashtagColor?: string;
  priority?: boolean;
  askProof?: boolean;
  hasTime?: boolean;
  scheduledAt?: string;
};

export type TaskVisibility = "private" | "friends" | "all";

export type AchievementPop = {
  emoji: string;
  title: string;
  description: string;
  color: string;
};

export const TASK_ACHIEVEMENTS: Record<string, AchievementPop> = {
  t1: { emoji: "🏃", title: "Бегущий по утрам", description: "15 пробежек до 9 утра", color: "#C8FF57" },
  t4: { emoji: "📚", title: "Книжный червь +1", description: "7 из 10 книг в этом году", color: "#7C5CFF" },
  t5: { emoji: "🧘", title: "Дзен на 3 недели", description: "21 день медитаций подряд", color: "#22B07D" },
};

export const VISIBILITY_OPTIONS: { id: TaskVisibility; label: string; activeClass: string }[] = [
  { id: "private", label: "🔒 Приватно", activeClass: "border-muted-foreground/40 text-muted-foreground bg-white/[0.04]" },
  { id: "friends", label: "👥 Друзьям", activeClass: "border-ice/40 text-ice bg-ice/10" },
  { id: "all", label: "🌍 Всем", activeClass: "border-good/40 text-good bg-good/10" },
];

/** Периоды в форме добавления (как в прототипе — без «Завтра») */
export const ADD_PERIOD_OPTIONS: { id: DiaryPeriod; label: string }[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "dream", label: "Мечта" },
];

export const INITIAL_TASKS: Record<DiaryPeriod, DiaryTask[]> = {
  today: [
    { id: "t1", text: "Пробежка 5 км перед работой", tag: "спорт", streak: 14, done: false },
    { id: "t2", text: "Позвонить маме", tag: "семья", done: false },
    { id: "t3", text: "Купить продукты", tag: "дом", checklist: "4 пункта", done: false },
    { id: "t4", text: "20 страниц «Дюны»", tag: "книги", streak: 6, done: false },
    { id: "t5", text: "Медитация 10 минут", tag: "здоровье", streak: 21, done: false },
  ],
  tomorrow: [
    { id: "m1", text: "Встреча с Лёшей в 14:00", tag: "встречи", done: false },
    { id: "m2", text: "Оплатить интернет", tag: "дом", done: false },
  ],
  week: [
    { id: "w1", text: "Сходить в зал 3 раза", tag: "спорт", done: false },
    { id: "w2", text: "Закрыть отчёт по проекту", tag: "работа", done: false },
    { id: "w3", text: "Сходить на йогу-флешмоб в парке", tag: "спорт", done: false },
  ],
  month: [
    { id: "mo1", text: "Накопить 30 000 на поездку", tag: "финансы", done: false },
    { id: "mo2", text: "Сходить к стоматологу", tag: "здоровье", done: false },
  ],
  year: [
    { id: "y1", text: "Пробежать полумарафон", tag: "спорт", done: false },
    { id: "y2", text: "Прочитать 24 книги", tag: "книги", checklist: "7/24", done: false },
  ],
  dream: [
    { id: "d1", text: "Выучить испанский до B1", tag: "языки", done: false },
    { id: "d2", text: "Съездить в Японию весной", tag: "путешествия", done: false },
  ],
};

export const ACHIEVEMENTS = [
  { emoji: "🏃", name: "Первый забег", done: true, color: "#C8FF57" },
  { emoji: "🔥", name: "Стрик 7 дней", done: true, color: "#C8FF57" },
  { emoji: "📚", name: "Книжный червь", progress: "6 / 10 книг", prog: 60, color: "#7C5CFF" },
  { emoji: "🤝", name: "Первый друг", done: true, color: "#00D9FF" },
  { emoji: "🌍", name: "Организатор челленджа", done: true, color: "#7C5CFF" },
  { emoji: "🎬", name: "Кинокритик", progress: "4 / 10 оценок", prog: 40, color: "#FF2D55" },
  { emoji: "⭐", name: "100 задач", done: true, color: "#FFB020" },
  { emoji: "🏆", name: "Победа в челлендже", locked: true, progress: "ещё не открыта", color: "#7A7A8A" },
  { emoji: "🥚", name: "Эволюция маскота", done: true, color: "#22B07D" },
  { emoji: "🗺️", name: "5 районов города", progress: "3 / 5", prog: 60, color: "#2D6BFF" },
];

export const LEVEL_REWARDS: Record<number, string> = {
  16: "Новая рамка профиля «Неон»",
  17: "Расширенная статистика района",
  18: "Кастомизация маскота",
  19: "+1 слот для вишлиста",
  20: "Право создавать челленджи",
  21: "Эксклюзивные стикеры в комменты",
  22: "Золотой бейдж на аватаре",
};

export const WISHLIST_ITEMS = [
  { emoji: "🎧", name: "Наушники Sony", price: "24 990 ₽", booked: false },
  { emoji: "📖", name: "Подписка на книги", price: "1 990 ₽", booked: true },
  { emoji: "🧣", name: "Тёплый шарф", price: "", booked: false },
  { emoji: "☕", name: "Турка для кофе", price: "2 400 ₽", booked: false },
];

export const MEDIA_FILMS = [
  { emoji: "🎬", name: "Дюна: Часть 2", status: "Завершено", color: "#22B07D", rate: "★★★★★" },
  { emoji: "🎬", name: "Опенгеймер", status: "Смотрю", color: "#2D6BFF" },
  { emoji: "📺", name: "Разделение", status: "Хочу", color: "#7A7A8A" },
];

export const MEDIA_BOOKS = [
  { emoji: "📚", name: "Дюна", status: "Читаю", color: "#2D6BFF" },
  { emoji: "📚", name: "Атомные привычки", status: "Завершено", color: "#22B07D", rate: "★★★★☆" },
];
