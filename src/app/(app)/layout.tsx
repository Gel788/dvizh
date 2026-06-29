import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { TrendMarquee } from "@/components/brand/marquee";
import { LocationSync } from "@/components/location/location-sync";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const unreadCount = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {user && <LocationSync />}
      <Sidebar user={user} unreadCount={unreadCount} />
      {/* offset for fixed sidebar */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-[248px] xl:pl-[260px]">
        <TopBar user={user} unreadCount={unreadCount} />
        <div className="hidden lg:block">
          <TrendMarquee />
        </div>
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <MobileNav user={user} />
      </div>
    </div>
  );
}
