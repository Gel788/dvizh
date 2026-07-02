/** Минуты вперёд от UTC → локальное время пользователя (как Dart `timeZoneOffset.inMinutes`). */
export const DEFAULT_TZ_OFFSET_MINUTES = 180; // Europe/Moscow

export function parseTzOffset(raw: string | null | undefined): number {
  if (raw == null || raw === "") return DEFAULT_TZ_OFFSET_MINUTES;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < -840 || n > 840) return DEFAULT_TZ_OFFSET_MINUTES;
  return Math.round(n);
}

export function userLocalParts(now: Date, tzOffsetMinutes: number) {
  const shifted = new Date(now.getTime() + tzOffsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    /** 0=Sun … 6=Sat в локали пользователя */
    weekday: shifted.getUTCDay(),
  };
}

export function userDayKey(now: Date, tzOffsetMinutes: number): string {
  const p = userLocalParts(now, tzOffsetMinutes);
  return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.date).padStart(2, "0")}`;
}

export function startOfUserDay(now: Date, tzOffsetMinutes: number): Date {
  const p = userLocalParts(now, tzOffsetMinutes);
  return new Date(Date.UTC(p.year, p.month, p.date) - tzOffsetMinutes * 60_000);
}

export function addUserLocalDays(now: Date, tzOffsetMinutes: number, deltaDays: number): Date {
  const start = startOfUserDay(now, tzOffsetMinutes);
  return new Date(start.getTime() + deltaDays * 86_400_000);
}

const RU_MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const RU_WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function formatParts(p: ReturnType<typeof userLocalParts>, withWeekday = true): string {
  const md = `${p.date} ${RU_MONTHS_SHORT[p.month]}`;
  if (!withWeekday) return md;
  return `${md}, ${RU_WEEKDAYS_SHORT[p.weekday]}`;
}

export function formatDiaryDayLabel(now: Date, tzOffsetMinutes: number): string {
  return formatParts(userLocalParts(now, tzOffsetMinutes));
}

/** Подписи временных рамок периодов для UI дневника. */
export function diaryPeriodFrames(now: Date, tzOffsetMinutes: number): Record<string, string> {
  const today = userLocalParts(now, tzOffsetMinutes);
  const tomorrow = userLocalParts(addUserLocalDays(now, tzOffsetMinutes, 1), tzOffsetMinutes);

  const mondayOffset = (today.weekday + 6) % 7;
  const weekEnd = userLocalParts(addUserLocalDays(now, tzOffsetMinutes, 6 - mondayOffset), tzOffsetMinutes);
  const weekStart = userLocalParts(addUserLocalDays(now, tzOffsetMinutes, -mondayOffset), tzOffsetMinutes);

  const monthEnd = new Date(Date.UTC(today.year, today.month + 1, 0));
  const monthEndParts = {
    year: monthEnd.getUTCFullYear(),
    month: monthEnd.getUTCMonth(),
    date: monthEnd.getUTCDate(),
    weekday: monthEnd.getUTCDay(),
  };

  return {
    today: formatParts(today),
    tomorrow: formatParts(tomorrow, false),
    week: `${weekStart.date}–${weekEnd.date} ${RU_MONTHS_SHORT[weekEnd.month]}`,
    month: `${RU_MONTHS_SHORT[today.month]} · до ${monthEndParts.date} ${RU_MONTHS_SHORT[monthEndParts.month]}`,
    year: `${today.year} · до 31 дек`,
    dream: "без срока",
  };
}
