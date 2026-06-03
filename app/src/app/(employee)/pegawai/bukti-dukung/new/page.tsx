import { ShellFrame } from "@/components/shell-frame";
import { SupportingDocumentForm } from "@/components/supporting-document-form";
import { requireCurrentUser } from "@/lib/auth";

export default async function EmployeeSupportingDocumentsCreatePage() {
  const user = await requireCurrentUser();

  return (
    <ShellFrame
      eyebrow="Employee Workspace"
      title="Tambah bukti dukung pribadi"
      description="Gunakan halaman ini untuk menambahkan file bukti dukung baru tanpa mengganggu fokus daftar dan monitoring pada halaman utama."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <SupportingDocumentForm
        mode="employee"
        employeeOptions={
          user.employee
            ? [{ id: user.employee.id, name: user.employee.name, nip: user.employee.nip }]
            : []
        }
        defaultEmployeeId={user.employee?.id}
      />
    </ShellFrame>
  );
}
