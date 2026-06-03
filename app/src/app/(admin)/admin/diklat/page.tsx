import Link from "next/link";
import { ShellFrame } from "@/components/shell-frame";
import { TrainingRecordsTable } from "@/components/training-records-table";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminTrainingRecords, getTrainingYears } from "@/lib/trainings";
import { appPath } from "@/lib/paths";
import {
  RiAddLine,
  RiDownloadLine,
  RiFilter3Line,
  RiRestartLine,
} from "@remixicon/react";

type AdminTrainingPageProps = {
  searchParams?: {
    employeeId?: string;
    year?: string;
  };
};

export default async function AdminTrainingPage({
  searchParams,
}: AdminTrainingPageProps) {
  const user = await requireAdminUser();
  const employeeId = Number(searchParams?.employeeId || 0);
  const year = Number(searchParams?.year || 0);
  const [employees, years, records] = await Promise.all([
    prisma.employee.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        nip: true,
        name: true,
      },
    }),
    getTrainingYears(),
    getAdminTrainingRecords({
      employeeId: employeeId || undefined,
      year: year || undefined,
      take: 100,
    }),
  ]);
  const exportParams = new URLSearchParams();

  if (employeeId) {
    exportParams.set("employeeId", String(employeeId));
  }

  if (year) {
    exportParams.set("year", String(year));
  }

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title="Data diklat seluruh pegawai"
      description="Admin dapat memfilter, mengelola, dan mengekspor data diklat. Penambahan data baru dilakukan dari halaman terpisah agar daftar tetap ringkas."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <div className="grid gap-4">
        <form className="planner-card rounded-[28px] p-5" method="get">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Pegawai</label>
              <select
                name="employeeId"
                defaultValue={employeeId ? String(employeeId) : ""}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
              >
                <option value="">Semua pegawai</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nip} - {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Tahun</label>
              <select
                name="year"
                defaultValue={year ? String(year) : ""}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
              >
                <option value="">Semua tahun</option>
                {years.map((itemYear) => (
                  <option key={itemYear} value={itemYear}>
                    {itemYear}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <button
                type="submit"
                className="inline-flex rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                <RiFilter3Line size={16} className="mr-2" />
                Terapkan filter
              </button>
              <Link
                href="/admin/diklat/new"
                className="inline-flex rounded-lg border border-slate-300 bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <RiAddLine size={16} className="mr-2" />
                Tambah
              </Link>
              <Link
                href="/admin/diklat"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <RiRestartLine size={16} className="mr-2" />
                Reset
              </Link>
              <a
                href={appPath(`/api/trainings/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`)}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <RiDownloadLine size={16} className="mr-2" />
                Export Excel
              </a>
            </div>
          </div>
        </form>
        <TrainingRecordsTable
          title="Data diklat"
          description="Daftar ini menampilkan data diklat hasil filter. Admin dapat mengedit, menghapus, dan mengekspor data langsung."
          records={records}
          baseEditPath="/admin/diklat"
          canManageAllEmployees={true}
        />
      </div>
    </ShellFrame>
  );
}
