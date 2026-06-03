"use client";

import Link from "next/link";
import { useState } from "react";
import { RiCheckboxCircleFill, RiCloseLine, RiInformationLine, RiTimeLine } from "@remixicon/react";
import { Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react";
import { PaginationControls, useTablePagination } from "@/components/table-pagination";

type EmployeeSummaryRecord = {
  periodMonth: number;
  periodYear: number;
  documentsCount: number;
  reviewStatus: "reviewed" | "pending";
  reviewedByLabel?: string | null;
  reviewComment?: string | null;
  reviewedAt?: Date | null;
};

type AdminSummaryRecord = EmployeeSummaryRecord & {
  employeeId: number;
  employee: {
    name: string;
    nip: string;
  };
};

type SupportingDocumentPeriodsTableProps = {
  title: string;
  description: string;
  records: EmployeeSummaryRecord[] | AdminSummaryRecord[];
  basePath: string;
  showEmployee?: boolean;
  detailBasePath?: string;
  detailEmployeeId?: number;
};

function hasEmployeeRecord(
  record: EmployeeSummaryRecord | AdminSummaryRecord,
): record is AdminSummaryRecord {
  return "employee" in record && "employeeId" in record;
}

function periodLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatReviewedAt(reviewedAt?: Date | null) {
  if (!reviewedAt) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(reviewedAt);
}

function buildHref(basePath: string, record: EmployeeSummaryRecord | AdminSummaryRecord, showEmployee: boolean) {
  const params = new URLSearchParams({
    periodMonth: String(record.periodMonth),
    periodYear: String(record.periodYear),
  });

  if (showEmployee && "employeeId" in record) {
    params.set("employeeId", String(record.employeeId));
  }

  return `${basePath}?${params.toString()}`;
}

function StatusIcon({ status }: { status: "reviewed" | "pending" }) {
  if (status === "reviewed") {
    return (
      <span className="inline-flex" title="Sudah direview" aria-label="Sudah direview">
        <RiCheckboxCircleFill size={18} className="text-emerald-600" />
      </span>
    );
  }

  return (
    <span className="inline-flex" title="Belum direview" aria-label="Belum direview">
      <RiTimeLine size={18} className="text-amber-600" />
    </span>
  );
}

export function SupportingDocumentPeriodsTable({
  title,
  description,
  records,
  basePath,
  showEmployee = false,
  detailBasePath,
  detailEmployeeId,
}: SupportingDocumentPeriodsTableProps) {
  const [activeRecord, setActiveRecord] = useState<EmployeeSummaryRecord | null>(null);
  const {
    currentPage,
    totalPages,
    paginatedItems,
    hasPagination,
    goToPreviousPage,
    goToNextPage,
  } = useTablePagination({ items: records, pageSize: 8 });

  return (
    <>
    <Card className="planner-card rounded-[28px] p-6">
      <Title className="!text-2xl !font-semibold !tracking-tight !text-slate-950">
        {title}
      </Title>
      <Text className="!mt-3 !text-sm !leading-7 !text-slate-500">
        {description}
      </Text>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <Table>
          <TableHead>
            <TableRow>
              {showEmployee ? <TableHeaderCell>Pegawai</TableHeaderCell> : null}
              <TableHeaderCell>Periode</TableHeaderCell>
              <TableHeaderCell>Jumlah File</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Reviewer</TableHeaderCell>
              <TableHeaderCell>Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.length ? (
              paginatedItems.map((record, index) => (
                <TableRow key={`${record.periodYear}-${record.periodMonth}-${showEmployee && "employeeId" in record ? record.employeeId : index}`}>
                  {showEmployee && hasEmployeeRecord(record) ? (
                    <TableCell>
                      <div className="whitespace-normal break-words font-medium text-slate-950">{record.employee.name}</div>
                      <div className="text-xs text-slate-400">{record.employee.nip}</div>
                    </TableCell>
                  ) : null}
                  <TableCell>{periodLabel(record.periodMonth, record.periodYear)}</TableCell>
                  <TableCell>{record.documentsCount}</TableCell>
                  <TableCell><StatusIcon status={record.reviewStatus} /></TableCell>
                  <TableCell><div className="whitespace-normal break-words">{record.reviewedByLabel || "-"}</div></TableCell>
                  <TableCell>
                    {detailBasePath && detailEmployeeId ? (
                      <Link
                        href={`${detailBasePath}?employeeId=${detailEmployeeId}&periodMonth=${record.periodMonth}&periodYear=${record.periodYear}`}
                        className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:bg-slate-100"
                      >
                        Buka periode
                      </Link>
                    ) : showEmployee ? (
                      <Link
                        href={buildHref(basePath, record, showEmployee)}
                        className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:bg-slate-100"
                      >
                        Buka periode
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveRecord(record)}
                        className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:bg-slate-100"
                      >
                        Buka periode
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showEmployee ? 6 : 5}>
                  <div className="py-4 text-sm text-slate-500">Belum ada periode bukti dukung yang tersedia.</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {hasPagination ? (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      ) : null}
    </Card>
    {activeRecord ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-500">
                Detail Periode
              </Text>
              <Title className="!mt-2 !text-2xl !font-semibold !tracking-tight !text-slate-950">
                {periodLabel(activeRecord.periodMonth, activeRecord.periodYear)}
              </Title>
            </div>
            <button
              type="button"
              onClick={() => setActiveRecord(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
            >
              <RiCloseLine size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-300 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Jumlah File
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {activeRecord.documentsCount}
              </div>
            </div>
            <div className="rounded-xl border border-slate-300 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Status
              </div>
              <div className="mt-2">
                <StatusIcon status={activeRecord.reviewStatus} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-300 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Reviewer
              </div>
              <div className="mt-2 text-sm font-medium text-slate-950">
                {activeRecord.reviewedByLabel || "-"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-300 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              <RiInformationLine size={14} />
              Masukan Atasan
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {activeRecord.reviewComment?.trim()
                ? activeRecord.reviewComment
                : "Belum ada masukan atasan untuk periode ini."}
            </p>
            <div className="mt-3 text-xs text-slate-500">
              Waktu review: {formatReviewedAt(activeRecord.reviewedAt)}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveRecord(null)}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
