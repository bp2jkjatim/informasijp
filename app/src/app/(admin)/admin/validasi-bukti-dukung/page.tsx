import { requireAdminUser } from "@/lib/auth";
import {
  getEmployeeSupportingDocumentPeriods,
} from "@/lib/supporting-documents";
import { ShellFrame } from "@/components/shell-frame";
import { SupportingDocumentPeriodsTable } from "@/components/supporting-document-periods-table";
import { prisma } from "@/lib/prisma";
import {
  RiAddLine,
  RiDownloadLine,
  RiFilter3Line,
  RiRestartLine,
} from "@remixicon/react";
import { Callout } from "@tremor/react";

type AdminSupportingDocumentsValidationPageProps = {
  searchParams?: {
    employeeId?: string;
  };
};

export default async function AdminSupportingDocumentsValidationPage({
  searchParams,
}: AdminSupportingDocumentsValidationPageProps) {
  const user = await requireAdminUser();
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      nip: true,
    },
  });

  const employeeId = Number(searchParams?.employeeId || 0);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const summaries = employeeId
    ? await getEmployeeSupportingDocumentPeriods(employeeId)
    : [];
  const exportParams = new URLSearchParams();

  if (employeeId) {
    exportParams.set("employeeId", String(employeeId));
  }

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title="Validasi Bukti Dukung"
      description="Pilih pegawai terlebih dahulu, lalu buka salah satu periode untuk meninjau file bukti dukung dan memberikan masukan atasan."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <div className="grid gap-4">
        <form className="planner-card rounded-[28px] p-3" method="get">
          <div className="grid gap-3 md:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">Pegawai</label>
              <select
                name="employeeId"
                defaultValue={employeeId ? String(employeeId) : ""}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
              >
                <option value="">Pilih pegawai</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nip} - {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              <RiFilter3Line size={16} className="mr-2" />
              Tampilkan periode
            </button>
            <a
              href="/admin/bukti-dukung/new"
              className="inline-flex rounded-lg border border-slate-300 bg-slate-950 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RiAddLine size={16} className="mr-2" />
              Tambah
            </a>
            <a
              href="/admin/validasi-bukti-dukung"
              className="inline-flex rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              <RiRestartLine size={16} className="mr-2" />
              Reset
            </a>
            <a
              href={`/api/supporting-documents/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              <RiDownloadLine size={16} className="mr-2" />
              Export Excel
            </a>
          </div>
        </form>
        {employeeId ? (
          <SupportingDocumentPeriodsTable
            title={`Ringkasan periode ${selectedEmployee?.name || ""}`}
            description="Daftar ini menampilkan seluruh periode yang sudah memiliki bukti dukung untuk pegawai terpilih. Buka salah satu periode untuk masuk ke halaman validasi detail."
            records={summaries}
            basePath="/admin/validasi-bukti-dukung"
            detailBasePath="/admin/validasi-bukti-dukung/detail"
            detailEmployeeId={employeeId}
          />
        ) : (
          <Callout title="Pilih pegawai terlebih dahulu" color="blue">
            Ringkasan periode akan ditampilkan setelah pegawai dipilih.
          </Callout>
        )}
      </div>
    </ShellFrame>
  );
}
