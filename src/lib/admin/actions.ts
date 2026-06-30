"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, getSession, isAdmin, verifyPassword } from "@/lib/auth";
import { invalidateFeedCache } from "@/lib/api/feed-cache";

async function guard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
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
  revalidatePath("/admin/feed");
  revalidatePath("/");
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    redirect("/admin/login?error=invalid");
  }
  if (user.role !== "ADMIN") {
    redirect("/admin/login?error=not_admin");
  }

  await createSession(user.id);
  redirect("/admin");
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
  const post = await db.post.findUnique({ where: { id: postId }, select: { city: true } });
  await db.post.delete({ where: { id: postId } });
  if (post?.city) invalidateFeedCache(post.city);
  revalidateAdmin();
  revalidatePath("/");
}

export async function togglePostFeaturedAction(postId: string) {
  await guard();
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return;
  await db.post.update({
    where: { id: postId },
    data: { featuredInFeed: !post.featuredInFeed, featuredBoost: post.featuredInFeed ? 0 : 50 },
  });
  invalidateFeedCache(post.city);
  revalidateAdmin();
  revalidatePath("/");
}

export async function togglePostHiddenAction(postId: string) {
  await guard();
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return;
  await db.post.update({
    where: { id: postId },
    data: { hiddenFromFeed: !post.hiddenFromFeed, featuredInFeed: false },
  });
  invalidateFeedCache(post.city);
  revalidateAdmin();
  revalidatePath("/");
}

export async function updatePostFeaturedBoostAction(formData: FormData) {
  await guard();
  const postId = String(formData.get("postId") ?? "");
  const boost = Number(formData.get("boost") ?? 0);
  if (!postId || Number.isNaN(boost)) return;
  const post = await db.post.update({
    where: { id: postId },
    data: { featuredBoost: Math.max(0, Math.min(100, Math.round(boost))), featuredInFeed: true },
  });
  invalidateFeedCache(post.city);
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

export async function createSponsoredPostAction(formData: FormData) {
  const admin = await guard();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const city = String(formData.get("city") ?? "Москва").trim();
  const address = String(formData.get("address") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim() || null;
  const boost = Number(formData.get("boost") ?? 80);
  const authorUsername = String(formData.get("authorUsername") ?? "").trim().toLowerCase();
  const imageData = String(formData.get("imageData") ?? "").trim();
  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");

  if (!content) return;

  let authorId = admin.id;
  if (authorUsername) {
    const author = await db.user.findUnique({ where: { username: authorUsername } });
    if (author) authorId = author.id;
  }

  const { geocodeAddress, cityCenter } = await import("@/lib/geo/geocode");
  const { absoluteMediaUrl, normalizePostImages, saveImageFromDataUrl, saveImageFromFile } = await import("@/lib/upload/media");
  const { parseCoord } = await import("@/lib/geo");

  let lat = latRaw != null && latRaw !== "" ? parseCoord(String(latRaw)) ?? null : null;
  let lng = lngRaw != null && lngRaw !== "" ? parseCoord(String(lngRaw)) ?? null : null;

  if (address && (lat == null || lng == null)) {
    const geo = await geocodeAddress(address, city);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
  }
  if (lat == null || lng == null) {
    const center = cityCenter(city);
    lat = center.lat;
    lng = center.lng;
  }

  let images = "";
  const imageFile = formData.get("image");
  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      const rel = await saveImageFromFile("posts", "sponsor", imageFile);
      images = normalizePostImages(absoluteMediaUrl(rel));
    } else if (imageData.startsWith("data:image/")) {
      const rel = await saveImageFromDataUrl("posts", "sponsor", imageData);
      images = normalizePostImages(absoluteMediaUrl(rel));
    }
  } catch (e) {
    console.error("sponsored image upload failed", e);
  }

  await db.post.create({
    data: {
      type: "ANNOUNCEMENT",
      authorId,
      title: title || "Спонсор",
      content,
      city,
      district,
      lat,
      lng,
      radiusKm: 8,
      contactInfo: address || null,
      images,
      featuredInFeed: true,
      featuredBoost: Math.max(0, Math.min(100, Math.round(boost))),
      tags: "sponsored,реклама",
    },
  });

  invalidateFeedCache(city);
  revalidateAdmin();
  revalidatePath("/");
  revalidatePath("/nearby");
  revalidatePath("/map");
}
