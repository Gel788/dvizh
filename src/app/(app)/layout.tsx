import { Sidebar } from "@/components/layout/sidebar";
import { V38BottomNav } from "@/components/layout/v38-bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { LocationSync } from "@/components/location/location-sync";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (user) {
    const profile = await db.userProfile.findUnique({
      where: { userId: user.id },
      select: { onboardingDone: true },
    });
    if (profile && profile.onboardingDone === false) {
      redirect("/onboarding");
    }
  }
  const unreadCount = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {user && <LocationSync />}
      <Sidebar user={user} unreadCount={unreadCount} />
      <div className="flex flex-1 flex-col min-w-0 lg:pl-[248px] xl:pl-[260px]">
        <TopBar user={user} unreadCount={unreadCount} />
        <main className="flex-1 pb-[148px] lg:pb-0">{children}</main>
        <Suspense fallback={null}>
          <V38BottomNav user={user} />
        </Suspense>
      </div>
    </div>
  );
}
