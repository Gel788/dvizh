import type { DuelPeriod, Visibility } from "@prisma/client";
import { db } from "@/lib/db";

const DUEL_PERIOD: Record<string, DuelPeriod> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

const VIS: Record<string, Visibility> = {
  private: "PRIVATE",
  friends: "FRIENDS",
  all: "PUBLIC",
};

const duelInclude = {
  creator: { select: { id: true, name: true, username: true, avatar: true } },
  participants: {
    orderBy: { streak: "desc" as const },
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
      marks: { orderBy: { markedAt: "desc" as const }, take: 42 },
    },
  },
};

export async function listDuelsForUser(userId: string) {
  const parts = await db.duelParticipant.findMany({
    where: { userId },
    include: { duel: { include: duelInclude } },
    orderBy: { joinedAt: "desc" },
  });
  return parts.map((p) => ({
    ...p.duel,
    myParticipantId: p.id,
    leader: p.duel.participants[0] ?? null,
  }));
}

export async function getDuelForUser(userId: string, duelId: string) {
  const part = await db.duelParticipant.findUnique({
    where: { duelId_userId: { duelId, userId } },
    include: { duel: { include: duelInclude } },
  });
  if (!part) return null;
  return {
    ...part.duel,
    myParticipantId: part.id,
    leader: part.duel.participants[0] ?? null,
  };
}

export async function createDuelRecord(
  creatorId: string,
  input: {
    title: string;
    description?: string;
    emoji?: string;
    period?: string;
    visibility?: string;
    friendIds: string[];
    remindersOn?: boolean;
  },
) {
  const friendIds = [...new Set(input.friendIds.filter(Boolean))];
  const ids = [...new Set([creatorId, ...friendIds])];
  if (ids.length < 2) throw new Error("MIN_PARTICIPANTS");
  if (ids.length > 8) throw new Error("MAX_PARTICIPANTS");

  const visibility = VIS[input.visibility ?? "private"] ?? "PRIVATE";
  const duel = await db.duel.create({
    data: {
      creatorId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      emoji: input.emoji || "⚔️",
      period: DUEL_PERIOD[input.period ?? "daily"] ?? "DAILY",
      visibility,
      remindersOn: input.remindersOn ?? true,
      participants: { create: ids.map((userId) => ({ userId })) },
    },
    include: duelInclude,
  });

  return duel;
}

export async function cloneDuelForUser(userId: string, duelId: string) {
  const source = await db.duel.findFirst({
    where: { id: duelId, participants: { some: { userId } } },
    include: { participants: true },
  });
  if (!source) return null;

  const friendIds = source.participants
    .map((p) => p.userId)
    .filter((id) => id !== userId);

  return createDuelRecord(userId, {
    title: `${source.title} (ещё раз)`,
    description: source.description ?? undefined,
    emoji: source.emoji ?? "⚔️",
    period: source.period.toLowerCase(),
    visibility: source.visibility.toLowerCase(),
    friendIds,
    remindersOn: source.remindersOn,
  });
}
