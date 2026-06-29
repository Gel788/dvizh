import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminStats, toDashboardData } from "@/lib/admin/stats";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  return <AdminDashboard data={toDashboardData(stats)} />;
}
