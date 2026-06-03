import { ShellFrame } from "@/components/shell-frame";
import { TrainingForm } from "@/components/training-form";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminTrainingCreatePage() {
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
      title="Tambah data diklat"
      description="Admin dapat menambahkan data diklat baru untuk pegawai mana pun dari halaman terpisah agar daftar data tetap fokus."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <TrainingForm mode="admin" employeeOptions={employees} />
    </ShellFrame>
  );
}
