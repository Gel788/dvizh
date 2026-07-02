import { db } from "@/lib/db";

const goalInclude = {
  creator: { select: { id: true, name: true, username: true, avatar: true } },
  members: {
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  },
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      assignee: { select: { id: true, name: true, username: true, avatar: true } },
    },
  },
};

export async function listSharedGoalsForUser(userId: string) {
  return db.sharedGoal.findMany({
    where: { members: { some: { userId } } },
    include: goalInclude,
    orderBy: [{ eventAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function getSharedGoalForUser(userId: string, goalId: string) {
  const goal = await db.sharedGoal.findFirst({
    where: { id: goalId, members: { some: { userId } } },
    include: goalInclude,
  });
  return goal;
}

export async function createSharedGoalRecord(
  creatorId: string,
  input: {
    title: string;
    items: string[];
    friendIds: string[];
    eventAt?: string | null;
  },
) {
  const memberIds = [...new Set([creatorId, ...input.friendIds.filter(Boolean)])];
  if (memberIds.length < 2) throw new Error("MIN_MEMBERS");

  const eventAt = input.eventAt ? new Date(input.eventAt) : null;
  const items = input.items.map((t) => t.trim()).filter(Boolean);
  if (!items.length) throw new Error("MIN_ITEMS");

  const goal = await db.sharedGoal.create({
    data: {
      creatorId,
      title: input.title.trim(),
      eventAt,
      members: { create: memberIds.map((userId) => ({ userId })) },
      items: { create: items.map((title, sortOrder) => ({ title, sortOrder })) },
    },
    include: goalInclude,
  });

  await db.activity.create({
    data: {
      userId: creatorId,
      type: "SHARED_GOAL_UPDATED",
      visibility: "FRIENDS",
      title: goal.title,
      body: `${items.length} пунктов · ${memberIds.length} участников`,
      metadata: JSON.stringify({ goalId: goal.id, kind: "created" }),
    },
  });

  return goal;
}

async function assertMember(userId: string, itemId: string) {
  const item = await db.sharedGoalItem.findUnique({
    where: { id: itemId },
    include: {
      goal: {
        select: {
          title: true,
          members: { select: { userId: true } },
        },
      },
    },
  });
  if (!item) return { error: "NOT_FOUND" as const };
  if (!item.goal.members.some((m) => m.userId === userId)) return { error: "FORBIDDEN" as const };
  return { item };
}

export async function claimSharedGoalItem(userId: string, itemId: string) {
  const check = await assertMember(userId, itemId);
  if ("error" in check) return check;
  const { item } = check;
  if (item.done) return { error: "ALREADY_DONE" as const };
  if (item.assigneeId && item.assigneeId !== userId) return { error: "TAKEN" as const };

  await db.sharedGoalItem.update({
    where: { id: itemId },
    data: { assigneeId: userId },
  });
  return { claimed: true };
}

export async function completeSharedGoalItemRecord(userId: string, itemId: string) {
  const check = await assertMember(userId, itemId);
  if ("error" in check) return check;
  const { item } = check;
  if (item.done) return { alreadyDone: true };

  await db.sharedGoalItem.update({
    where: { id: itemId },
    data: { done: true, assigneeId: userId },
  });

  await db.activity.create({
    data: {
      userId,
      type: "SHARED_GOAL_UPDATED",
      visibility: "FRIENDS",
      title: item.title,
      body: item.goal.title,
      metadata: JSON.stringify({ goalItemId: itemId }),
    },
  });

  return { done: true };
}
