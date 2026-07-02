import type { DuelPeriod } from "@prisma/client";

export function duelMarkedToday(markedAt: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(markedAt) >= today;
}

export function msUntilPeriodEnd(period: DuelPeriod) {
  const now = new Date();
  const end = new Date(now);
  if (period === "DAILY") {
    end.setHours(24, 0, 0, 0);
  } else if (period === "WEEKLY") {
    const day = end.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    end.setDate(end.getDate() + daysUntilMonday);
    end.setHours(0, 0, 0, 0);
  } else if (period === "MONTHLY") {
    end.setMonth(end.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
  } else {
    end.setFullYear(end.getFullYear() + 1, 0, 1);
    end.setHours(0, 0, 0, 0);
  }
  return Math.max(0, end.getTime() - now.getTime());
}
