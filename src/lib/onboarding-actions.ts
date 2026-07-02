"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createDiaryTaskAction } from "@/lib/diary-actions";

async function me() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function finishOnboardingAction(input: {
  mascotVariant: number;
  city: string;
  district?: string;
  defaultDiary: string;
  defaultMedia: string;
  defaultWishlist: string;
  askProofDefault: boolean;
  firstTaskTitle: string;
  firstTaskPriority: boolean;
}) {
  const session = await me();
  const VIS: Record<string, "PRIVATE" | "FRIENDS" | "PUBLIC"> = {
    private: "PRIVATE", friends: "FRIENDS", all: "PUBLIC",
  };

  await db.$transaction([
    db.user.update({
      where: { id: session.id },
      data: {
        city: input.city.trim() || session.city,
        district: input.district?.trim() || null,
      },
    }),
    db.userProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        mascotVariant: input.mascotVariant,
        mascotStage: 0,
        onboardingDone: true,
      },
      update: {
        mascotVariant: input.mascotVariant,
        onboardingDone: true,
      },
    }),
    db.privacySettings.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        defaultDiary: VIS[input.defaultDiary] ?? "PRIVATE",
        defaultMedia: VIS[input.defaultMedia] ?? "FRIENDS",
        defaultWishlist: VIS[input.defaultWishlist] ?? "FRIENDS",
      },
      update: {
        defaultDiary: VIS[input.defaultDiary] ?? "PRIVATE",
        defaultMedia: VIS[input.defaultMedia] ?? "FRIENDS",
        defaultWishlist: VIS[input.defaultWishlist] ?? "FRIENDS",
      },
    }),
  ]);

  if (input.firstTaskTitle.trim()) {
    await createDiaryTaskAction({
      text: input.firstTaskTitle.trim(),
      period: "today",
      visibility: input.defaultDiary === "all" ? "all" : input.defaultDiary === "friends" ? "friends" : "private",
      priority: input.firstTaskPriority,
      askProof: input.askProofDefault,
    });
  }

  revalidatePath("/");
  revalidatePath(`/profile/${session.username}`);
  redirect("/profile/" + session.username);
}
