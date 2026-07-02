import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await db.userProfile.findUnique({ where: { userId: session.id } });
  if (profile?.onboardingDone !== false) redirect("/");

  return <OnboardingFlow />;
}
