import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const unreadCount = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} unreadCount={unreadCount} />
      {/* offset for fixed sidebar */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-[220px]">
        <TopBar user={user} unreadCount={unreadCount} />
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <MobileNav user={user} unreadCount={unreadCount} />
      </div>
    </div>
  );
}
