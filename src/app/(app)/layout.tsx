import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { MobileCreateFab } from "@/components/layout/create-menu";
import { TopBar } from "@/components/layout/top-bar";
import { TrendMarquee } from "@/components/brand/marquee";
import { LocationSync } from "@/components/location/location-sync";
import { RefRouteStyle } from "@/components/surface/ref-route-style";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

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
      <RefRouteStyle />
      <Sidebar user={user} unreadCount={unreadCount} />
      {/* offset for fixed sidebar */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-[248px] xl:pl-[260px]">
        <TopBar user={user} unreadCount={unreadCount} />
        <div className="hidden lg:block">
          <TrendMarquee />
        </div>
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <MobileCreateFab user={user} />
        <MobileNav user={user} />
      </div>
    </div>
  );
}
