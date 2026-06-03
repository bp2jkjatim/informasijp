import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminUser } from "@/lib/auth";
import { getAdminDashboardSummary } from "@/lib/dashboard";

export default async function AdminPage() {
  const user = await requireAdminUser();
  const summary = await getAdminDashboardSummary();

  return (
    <AdminDashboard
      user={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
      summary={summary}
    />
  );
}
