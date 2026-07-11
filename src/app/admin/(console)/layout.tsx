import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavBadges } from "@/lib/admin/stats";
import { getSession, isAdmin } from "@/lib/auth";
import "@/styles/admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/");

  const badges = await getAdminNavBadges();

  return (
    <div className="dark min-h-screen">
      <AdminShell user={session} badges={badges}>{children}</AdminShell>
    </div>
  );
}
