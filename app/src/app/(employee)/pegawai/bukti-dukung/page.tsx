import { requireCurrentUser } from "@/lib/auth";
import {
  getEmployeeSupportingDocumentPeriods,
  getEmployeeSupportingDocuments,
  getPeriodLabel,
} from "@/lib/supporting-documents";
import { ShellFrame } from "@/components/shell-frame";
import { SupportingDocumentTable } from "@/components/supporting-document-table";
import { SupportingDocumentPeriodsTable } from "@/components/supporting-document-periods-table";
import {
  RiAddLine,
  RiDownloadLine,
  RiFilter3Line,
  RiRestartLine,
} from "@remixicon/react";

type EmployeeSupportingDocumentsPageProps = {
  searchParams?: {
    periodMonth?: string;
    periodYear?: string;
  };
};

export default async function EmployeeSupportingDocumentsPage({
  searchParams,
}: EmployeeSupportingDocumentsPageProps) {
  const user = await requireCurrentUser();
  const employeeId = user.employeeId ?? 0;
  const periodMonth = Number(searchParams?.periodMonth || 0);
  const periodYear = Number(searchParams?.periodYear || 0);
  const [periods, records] = await Promise.all([
    getEmployeeSupportingDocumentPeriods(employeeId),
    getEmployeeSupportingDocuments(employeeId, {
      periodMonth: periodMonth || undefined,
      periodYear: periodYear || undefined,
    }),
  ]);
  const availableYears = Array.from(new Set(periods.map((period) => period.periodYear))).sort((a, b) => b - a);
  const exportParams = new URLSearchParams();

  if (periodMonth) {
    exportParams.set("periodMonth", String(periodMonth));
  }

  if (periodYear) {
    exportParams.set("periodYear", String(periodYear));
  }

  return (
    <ShellFrame
      eyebrow="Employee Workspace"
      title="Bukti Dukung"
      description="Pegawai dapat mengunggah lebih dari satu bukti dukung dalam satu periode bulan dan tahun."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <div className="grid gap-4">
        <form className="planner-card rounded-[28px] p-3" method="get">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">Bulan</label>
              <select
                name="periodMonth"
                defaultValue={periodMonth ? String(periodMonth) : ""}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
              >
                <option value="">Semua bulan</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {getPeriodLabel(index + 1, 2026).replace(" 2026", "")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-900">Tahun</label>
              <select
                name="periodYear"
                defaultValue={periodYear ? String(periodYear) : ""}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
              >
                <option value="">Semua tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                type="submit"
                className="inline-flex rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                <RiFilter3Line size={16} className="mr-2" />
                Terapkan filter
              </button>
              <a
                href="/pegawai/bukti-dukung/new"
                className="inline-flex rounded-lg border border-slate-300 bg-slate-950 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <RiAddLine size={16} className="mr-2" />
                Tambah
              </a>
              <a
                href="/pegawai/bukti-dukung"
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
          </div>
        </form>
        <SupportingDocumentPeriodsTable
          title="Ringkasan periode"
          description="Gunakan daftar ini untuk melihat periode yang sudah memiliki file bukti dukung beserta status review admin."
          records={periods}
          basePath="/pegawai/bukti-dukung"
        />
        <SupportingDocumentTable
          title="Riwayat bukti dukung"
          description="Daftar ini menampilkan seluruh bukti dukung yang telah Anda unggah beserta status review pada periodenya."
          records={records}
          canManage
        />
      </div>
    </ShellFrame>
  );
}
