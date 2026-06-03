import { EmployeeDashboard } from "@/components/employee-dashboard";
import { requireCurrentUser } from "@/lib/auth";
import { getEmployeeDashboardSummary } from "@/lib/dashboard";

export default async function EmployeePage() {
  const user = await requireCurrentUser();
  const summary = await getEmployeeDashboardSummary(user.employeeId ?? 0);

  return (
    <EmployeeDashboard
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
