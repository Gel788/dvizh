import { db } from "@/lib/db";
import { sentenceCase } from "@/lib/text-format";

const goalInclude = {
  creator: { select: { id: true, name: true, username: true, avatar: true } },
  members: {
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  },
  items: {
    orderBy: [{ done: "asc" as const }, { sortOrder: "asc" as const }],
    include: {
      assignee: { select: { id: true, name: true, username: true, avatar: true } },
    },
  },
};

export async function listSharedGoalsForUser(userId: string) {
  return db.sharedGoal.findMany({
    where: {
      members: {
        some: {
          userId,
          status: { in: ["INVITED", "ACCEPTED"] },
        },
      },
    },
    include: goalInclude,
    orderBy: [{ eventAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function getSharedGoalForUser(userId: string, goalId: string) {
  const goal = await db.sharedGoal.findFirst({
    where: {
      id: goalId,
      members: {
        some: {
          userId,
          status: { in: ["INVITED", "ACCEPTED"] },
        },
      },
    },
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
  const items = input.items.map((t) => sentenceCase(t.trim())).filter(Boolean);
  if (!items.length) throw new Error("MIN_ITEMS");

  const creator = await db.user.findUnique({
    where: { id: creatorId },
    select: { name: true, username: true },
  });

  const goal = await db.sharedGoal.create({
    data: {
      creatorId,
      title: sentenceCase(input.title),
      eventAt,
      members: {
        create: memberIds.map((userId) => ({
          userId,
          status: userId === creatorId ? "ACCEPTED" : "INVITED",
        })),
      },
      items: { create: items.map((title, sortOrder) => ({ title, sortOrder })) },
    },
    include: goalInclude,
  });

  const invitees = memberIds.filter((id) => id !== creatorId);
  if (invitees.length) {
    await db.notification.createMany({
      data: invitees.map((userId) => ({
        userId,
        type: "SHARED_GOAL_INVITE" as const,
        title: `${creator?.name ?? "Друг"} приглашает в список`,
        body: goal.title,
        link: "/friends?view=together",
      })),
    });
  }

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

export async function respondSharedGoalInvite(userId: string, goalId: string, accept: boolean) {
  const member = await db.sharedGoalMember.findFirst({
    where: { goalId, userId },
    include: { goal: { select: { title: true, creatorId: true } } },
  });
  if (!member) return { error: "NOT_FOUND" as const };
  if (member.status === "DECLINED") return { error: "ALREADY_DECLINED" as const };
  if (member.status === "ACCEPTED" && accept) return { status: "ACCEPTED" as const };

  await db.sharedGoalMember.update({
    where: { id: member.id },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  if (accept) {
    await db.activity.create({
      data: {
        userId,
        type: "SHARED_GOAL_UPDATED",
        visibility: "FRIENDS",
        title: member.goal.title,
        body: "присоединился к списку",
        metadata: JSON.stringify({ goalId, kind: "joined" }),
      },
    });
  }

  return { status: accept ? ("ACCEPTED" as const) : ("DECLINED" as const) };
}

async function assertMember(userId: string, itemId: string) {
  const item = await db.sharedGoalItem.findUnique({
    where: { id: itemId },
    include: {
      goal: {
        select: {
          title: true,
          members: { select: { userId: true, status: true } },
        },
      },
    },
  });
  if (!item) return { error: "NOT_FOUND" as const };
  const membership = item.goal.members.find((m) => m.userId === userId);
  if (!membership || membership.status === "DECLINED") return { error: "FORBIDDEN" as const };
  if (membership.status === "INVITED") return { error: "INVITE_PENDING" as const };
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
