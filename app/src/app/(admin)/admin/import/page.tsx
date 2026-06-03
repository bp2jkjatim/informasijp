import { ExcelImportCard } from "@/components/excel-import-card";
import { ShellFrame } from "@/components/shell-frame";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminImportPage() {
  const user = await requireAdminUser();

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title="Import Excel operasional"
      description="Halaman ini disiapkan untuk sinkronisasi master pegawai dan summary JP dari workbook Excel yang tersedia saat ini."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <ExcelImportCard />
    </ShellFrame>
  );
}
