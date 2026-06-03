"use client";

import Link from "next/link";
import {
  RiArrowRightUpLine,
  RiDatabase2Line,
  RiDownloadCloud2Line,
  RiFileList2Line,
  RiInboxArchiveLine,
} from "@remixicon/react";
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react";
import { MetricCard } from "@/components/metric-card";
import { ShellFrame } from "@/components/shell-frame";
import { PaginationControls, useTablePagination } from "@/components/table-pagination";

type AdminDashboardProps = {
  user: {
    username: string;
    role: string;
    name: string;
    jobTitle: string;
  };
  summary: {
    activePeriodMonth: number;
    activePeriodYear: number;
    totalEmployees: number;
    totalUsers: number;
    totalAdmins: number;
    totalTrainings: number;
    totalSupportingDocuments: number;
    supportingDocumentsUploadedThisPeriod: number;
    pendingSupportPeriodCount: number;
    employeeStatusCounts: Array<{
      employeeStatus: string;
      _count: { _all: number };
    }>;
    employmentStateCounts: Array<{
      employmentState: string | null;
      _count: { _all: number };
    }>;
    employeesWithoutSupportingDocumentsThisPeriod: Array<{
      id: number;
      nip: string;
      name: string;
      jobTitle: string | null;
    }>;
    topTrainingJpEmployees: Array<{
      employeeId: number;
      totalJp: number;
      employee: {
        id: number;
        nip: string;
        name: string;
        jobTitle: string | null;
      } | null;
    }>;
    employeeCategoryProgress: Array<{
      id: number;
      nip: string;
      name: string;
      jobTitle: string | null;
      pbjJp: number;
      jabatanJp: number;
      integritasJp: number;
      missingCategories: string[];
    }>;
    pendingSupportPeriods: Array<{
      employeeId: number;
      periodMonth: number;
      periodYear: number;
      documentsCount: number;
      employee: {
        id: number;
        nip: string;
        name: string;
      } | null;
    }>;
  };
};

function getPeriodLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AdminDashboard({ user, summary }: AdminDashboardProps) {
  const activePeriodLabel = getPeriodLabel(summary.activePeriodMonth, summary.activePeriodYear);
  const employeeStatusRows = summary.employeeStatusCounts.map((item) => ({
    label: item.employeeStatus,
    count: item._count._all,
  }));
  const employmentRows = summary.employmentStateCounts.map((item) => ({
    label: item.employmentState || "tidak_diisi",
    count: item._count._all,
  }));
  const missingUploads = useTablePagination({
    items: summary.employeesWithoutSupportingDocumentsThisPeriod,
    pageSize: 5,
  });
  const missingCategories = useTablePagination({
    items: summary.employeeCategoryProgress,
    pageSize: 5,
  });
  const pendingPeriods = useTablePagination({
    items: summary.pendingSupportPeriods,
    pageSize: 5,
  });
  const topJpRows = useTablePagination({
    items: summary.topTrainingJpEmployees,
    pageSize: 5,
  });

  return (
    <ShellFrame
      title="Panel admin dan pimpinan"
      eyebrow="Admin Workspace"
      description="Dashboard ini memusatkan monitoring diklat, bukti dukung, dan tindak lanjut validasi periode aktif."
      currentUser={user}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pegawai Aktif Sistem"
          value={String(summary.totalEmployees)}
          detail={`${summary.totalUsers} akun login, ${summary.totalAdmins} admin`}
          progress={Math.min((summary.totalUsers / Math.max(summary.totalEmployees, 1)) * 100, 100)}
        />
        <MetricCard
          label="Data Diklat"
          value={String(summary.totalTrainings)}
          detail="Total data diklat yang tersimpan"
          progress={Math.min(summary.totalTrainings, 100)}
        />
        <MetricCard
          label="Bukti Dukung"
          value={String(summary.totalSupportingDocuments)}
          detail={`${summary.supportingDocumentsUploadedThisPeriod} pegawai sudah upload pada ${activePeriodLabel}`}
          progress={Math.min((summary.supportingDocumentsUploadedThisPeriod / Math.max(summary.totalEmployees, 1)) * 100, 100)}
        />
        <MetricCard
          label="Periode Belum Direview"
          value={String(summary.pendingSupportPeriodCount)}
          detail="Periode bukti dukung yang masih menunggu validasi admin"
          progress={Math.min(summary.pendingSupportPeriodCount * 10, 100)}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="planner-card rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
                Monitoring Periode Aktif
              </Text>
              <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
                Pegawai belum upload bukti dukung
              </Title>
              <Text className="!mt-2 !text-sm !leading-6 !text-slate-500">
                Fokus periode {activePeriodLabel}. Daftar ini membantu admin mengejar pegawai yang belum mengirim bukti dukung.
              </Text>
            </div>
            <Link
              href={`/admin/validasi-bukti-dukung?periodMonth=${summary.activePeriodMonth}&periodYear=${summary.activePeriodYear}`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RiInboxArchiveLine size={16} className="mr-2" />
              Buka validasi periode
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Pegawai</TableHeaderCell>
                  <TableHeaderCell>Jabatan</TableHeaderCell>
                  <TableHeaderCell>Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {missingUploads.paginatedItems.length ? (
                  missingUploads.paginatedItems.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium text-slate-950">{employee.name}</div>
                        <div className="text-xs text-slate-400">{employee.nip}</div>
                      </TableCell>
                      <TableCell>{employee.jobTitle || "-"}</TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/validasi-bukti-dukung?employeeId=${employee.id}&periodMonth=${summary.activePeriodMonth}&periodYear=${summary.activePeriodYear}`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-50"
                        >
                          <RiArrowRightUpLine size={14} className="mr-1" />
                          Buka periode
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="py-4 text-sm text-slate-500">
                        Semua pegawai yang terdaftar sudah memiliki bukti dukung pada periode {activePeriodLabel}.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {missingUploads.hasPagination ? (
            <PaginationControls
              currentPage={missingUploads.currentPage}
              totalPages={missingUploads.totalPages}
              onPrevious={missingUploads.goToPreviousPage}
              onNext={missingUploads.goToNextPage}
            />
          ) : null}
        </Card>

        <div className="grid gap-4">
          <Card className="planner-card rounded-[28px] p-6 shadow-none">
            <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
              Quick Actions
            </Text>
            <Title className="!mt-3 !text-xl !font-semibold !tracking-tight !text-slate-950">
              Shortcut operasional
            </Title>
            <div className="mt-4 grid gap-3">
              <Link href="/admin/diklat" className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50">
                <RiFileList2Line size={16} className="mr-2" />
                Kelola data diklat
              </Link>
              <Link href={`/admin/validasi-bukti-dukung?periodMonth=${summary.activePeriodMonth}&periodYear=${summary.activePeriodYear}`} className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50">
                <RiInboxArchiveLine size={16} className="mr-2" />
                Validasi bukti dukung periode aktif
              </Link>
              <Link href="/admin/import" className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50">
                <RiDownloadCloud2Line size={16} className="mr-2" />
                Import data Excel
              </Link>
            </div>
          </Card>

          <Card className="planner-card rounded-[28px] p-6 shadow-none">
            <Title className="!text-xl !font-semibold !tracking-tight !text-slate-950">
              Ringkasan roster
            </Title>
            <div className="mt-4 space-y-3">
              {employeeStatusRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{row.label}</span>
                  <span className="text-sm text-slate-500">{row.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {employmentRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{row.label}</span>
                  <span className="text-sm text-slate-500">{row.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="planner-card rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
                Validasi Bisnis JP
              </Text>
              <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
                Pegawai dengan kategori belum lengkap
              </Title>
            </div>
            <Link
              href="/admin/diklat"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RiDatabase2Line size={16} className="mr-2" />
              Buka data diklat
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Pegawai</TableHeaderCell>
                  <TableHeaderCell>PBJ</TableHeaderCell>
                  <TableHeaderCell>Jabatan</TableHeaderCell>
                  <TableHeaderCell>Integritas</TableHeaderCell>
                  <TableHeaderCell>Kekurangan</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {missingCategories.paginatedItems.length ? (
                  missingCategories.paginatedItems.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium text-slate-950">{employee.name}</div>
                        <div className="text-xs text-slate-400">{employee.nip}</div>
                      </TableCell>
                      <TableCell>{employee.pbjJp}</TableCell>
                      <TableCell>{employee.jabatanJp}</TableCell>
                      <TableCell>{employee.integritasJp}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {employee.missingCategories.map((category) => (
                            <Badge key={category} color="amber">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-4 text-sm text-slate-500">
                        Semua pegawai yang memiliki data diklat sudah memiliki kategori dasar.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {missingCategories.hasPagination ? (
            <PaginationControls
              currentPage={missingCategories.currentPage}
              totalPages={missingCategories.totalPages}
              onPrevious={missingCategories.goToPreviousPage}
              onNext={missingCategories.goToNextPage}
            />
          ) : null}
        </Card>

        <Card className="planner-card rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
                Validasi Bukti Dukung
              </Text>
              <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
                Periode belum direview
              </Title>
            </div>
            <Badge color={summary.pendingSupportPeriodCount ? "amber" : "emerald"}>
              {summary.pendingSupportPeriodCount ? `${summary.pendingSupportPeriodCount} pending` : "Semua direview"}
            </Badge>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Pegawai</TableHeaderCell>
                  <TableHeaderCell>Periode</TableHeaderCell>
                  <TableHeaderCell>File</TableHeaderCell>
                  <TableHeaderCell>Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingPeriods.paginatedItems.length ? (
                  pendingPeriods.paginatedItems.map((period) => (
                    <TableRow key={`${period.employeeId}-${period.periodYear}-${period.periodMonth}`}>
                      <TableCell>
                        <div className="font-medium text-slate-950">{period.employee?.name || "-"}</div>
                        <div className="text-xs text-slate-400">{period.employee?.nip || "-"}</div>
                      </TableCell>
                      <TableCell>{getPeriodLabel(period.periodMonth, period.periodYear)}</TableCell>
                      <TableCell>{period.documentsCount}</TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/validasi-bukti-dukung?employeeId=${period.employeeId}&periodMonth=${period.periodMonth}&periodYear=${period.periodYear}`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-50"
                        >
                          <RiArrowRightUpLine size={14} className="mr-1" />
                          Review
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="py-4 text-sm text-slate-500">
                        Tidak ada periode bukti dukung yang menunggu review.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pendingPeriods.hasPagination ? (
            <PaginationControls
              currentPage={pendingPeriods.currentPage}
              totalPages={pendingPeriods.totalPages}
              onPrevious={pendingPeriods.goToPreviousPage}
              onNext={pendingPeriods.goToNextPage}
            />
          ) : null}
        </Card>

        <Card className="planner-card rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
                Monitoring Diklat
              </Text>
              <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
                Pegawai dengan total JP tertinggi
              </Title>
            </div>
            <Link
              href="/admin/diklat"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RiDatabase2Line size={16} className="mr-2" />
              Buka data diklat
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Pegawai</TableHeaderCell>
                  <TableHeaderCell>Jabatan</TableHeaderCell>
                  <TableHeaderCell>Total JP</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topJpRows.paginatedItems.length ? (
                  topJpRows.paginatedItems.map((item) => (
                    <TableRow key={item.employeeId}>
                      <TableCell>
                        <div className="font-medium text-slate-950">{item.employee?.name || "-"}</div>
                        <div className="text-xs text-slate-400">{item.employee?.nip || "-"}</div>
                      </TableCell>
                      <TableCell>{item.employee?.jobTitle || "-"}</TableCell>
                      <TableCell>{item.totalJp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="py-4 text-sm text-slate-500">
                        Belum ada data diklat yang bisa diringkas.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {topJpRows.hasPagination ? (
            <PaginationControls
              currentPage={topJpRows.currentPage}
              totalPages={topJpRows.totalPages}
              onPrevious={topJpRows.goToPreviousPage}
              onNext={topJpRows.goToNextPage}
            />
          ) : null}
        </Card>
      </div>
    </ShellFrame>
  );
}
