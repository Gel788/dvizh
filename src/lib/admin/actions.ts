"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";

async function guard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!isAdmin(session)) redirect("/");
  return session;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/challenges");
  revalidatePath("/admin/events");
  revalidatePath("/admin/clubs");
  revalidatePath("/admin/achievements");
  revalidatePath("/admin/system");
}

export async function toggleUserVerifiedAction(userId: string) {
  const admin = await guard();
  if (userId === admin.id) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await db.user.update({
    where: { id: userId },
    data: { verified: !user.verified },
  });
  revalidateAdmin();
}

export async function setUserRoleAction(userId: string, role: UserRole) {
  const admin = await guard();
  if (userId === admin.id && role !== "ADMIN") return;

  await db.user.update({ where: { id: userId }, data: { role } });
  revalidateAdmin();
}

export async function updateUserReputationAction(formData: FormData) {
  await guard();
  const userId = String(formData.get("userId") ?? "");
  const reputation = Number(formData.get("reputation") ?? 0);
  if (!userId || Number.isNaN(reputation)) return;

  await db.user.update({
    where: { id: userId },
    data: { reputation: Math.max(0, Math.round(reputation)) },
  });
  revalidateAdmin();
}

export async function deleteUserAction(userId: string) {
  const admin = await guard();
  if (userId === admin.id) return;

  await db.user.delete({ where: { id: userId } });
  revalidateAdmin();
}

export async function deletePostAction(postId: string) {
  await guard();
  await db.post.delete({ where: { id: postId } });
  revalidateAdmin();
  revalidatePath("/");
}

export async function deleteEventAction(eventId: string) {
  await guard();
  await db.event.delete({ where: { id: eventId } });
  revalidateAdmin();
}

export async function deleteClubAction(clubId: string) {
  await guard();
  await db.club.delete({ where: { id: clubId } });
  revalidateAdmin();
}

export async function deleteChallengeAction(challengeId: string) {
  await guard();
  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: { postId: true },
  });
  if (!challenge) return;
  await db.post.delete({ where: { id: challenge.postId } });
  revalidateAdmin();
}

export async function broadcastNotificationAction(formData: FormData) {
  await guard();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim() || null;
  if (!title || !body) return;

  const users = await db.user.findMany({ select: { id: true } });
  if (users.length === 0) return;

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "FOLLOW" as const,
      title,
      body,
      link,
    })),
  });
  revalidateAdmin();
}

export async function deleteAchievementAction(achievementId: string) {
  await guard();
  await db.achievementDef.delete({ where: { id: achievementId } });
  revalidateAdmin();
}

export async function createAchievementAction(formData: FormData) {
  await guard();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const icon = String(formData.get("icon") ?? "🏆").trim() || "🏆";
  const threshold = Number(formData.get("threshold") ?? 1);

  if (!slug || !name || !description) return;

  await db.achievementDef.create({
    data: {
      slug,
      name,
      description,
      category,
      icon,
      threshold: Math.max(1, threshold),
    },
  });
  revalidateAdmin();
}
