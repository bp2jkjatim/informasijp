import { ShellFrame } from "@/components/shell-frame";
import { TrainingForm } from "@/components/training-form";
import { requireCurrentUser } from "@/lib/auth";

export default async function EmployeeTrainingCreatePage() {
  const user = await requireCurrentUser();

  return (
    <ShellFrame
      eyebrow="Employee Workspace"
      title="Tambah diklat pribadi"
      description="Gunakan halaman ini untuk menambahkan riwayat diklat baru tanpa mengganggu fokus daftar data pada halaman utama."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <TrainingForm
        mode="employee"
        employeeOptions={
          user.employee
            ? [
                {
                  id: user.employee.id,
                  name: user.employee.name,
                  nip: user.employee.nip,
                },
              ]
            : []
        }
        defaultEmployeeId={user.employee?.id}
      />
    </ShellFrame>
  );
}
