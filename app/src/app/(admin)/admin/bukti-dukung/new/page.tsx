import { ShellFrame } from "@/components/shell-frame";
import { SupportingDocumentForm } from "@/components/supporting-document-form";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminSupportingDocumentsCreatePage() {
  const user = await requireAdminUser();
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      nip: true,
      name: true,
    },
  });

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title="Tambah bukti dukung"
      description="Admin dapat menambahkan bukti dukung untuk pegawai tertentu dari halaman terpisah agar daftar validasi tetap fokus."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <SupportingDocumentForm
        mode="admin"
        employeeOptions={employees}
        defaultEmployeeId={user.employee?.id}
      />
    </ShellFrame>
  );
}
