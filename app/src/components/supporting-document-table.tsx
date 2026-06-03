"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  RiCheckboxCircleFill,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEdit2Line,
  RiEyeLine,
  RiTimeLine,
} from "@remixicon/react";
import { Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react";
import { PaginationControls, useTablePagination } from "@/components/table-pagination";

type SupportingDocumentRecord = {
  id: number;
  periodMonth: number;
  periodYear: number;
  description: string;
  fileOriginalName: string;
  mimeType: string | null;
  createdAt: Date;
  reviewStatus?: "reviewed" | "pending";
  employee?: {
    name: string;
    nip: string;
  };
};

type SupportingDocumentTableProps = {
  title: string;
  description: string;
  records: SupportingDocumentRecord[];
  showEmployee?: boolean;
  canManage?: boolean;
};

function StatusIcon({ status }: { status?: "reviewed" | "pending" }) {
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

function canPreview(mimeType: string | null) {
  return !!mimeType && (mimeType.startsWith("image/") || mimeType === "application/pdf");
}

function periodLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SupportingDocumentTable({
  title,
  description,
  records,
  showEmployee = false,
  canManage = false,
}: SupportingDocumentTableProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const {
    currentPage,
    totalPages,
    paginatedItems,
    hasPagination,
    goToPreviousPage,
    goToNextPage,
  } = useTablePagination({ items: records, pageSize: 10 });

  async function handleEdit(record: SupportingDocumentRecord) {
    const description = window.prompt("Ubah deskripsi bukti dukung", record.description)?.trim();

    if (!description || description === record.description) {
      return;
    }

    setBusyId(record.id);

    try {
      const response = await fetch(`/api/supporting-documents/${record.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        window.alert(payload.message || "Gagal memperbarui deskripsi bukti dukung.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("Terjadi gangguan koneksi saat memperbarui deskripsi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(record: SupportingDocumentRecord) {
    const confirmed = window.confirm(
      `Hapus bukti dukung "${record.fileOriginalName}" untuk periode ${periodLabel(record.periodMonth, record.periodYear)}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(record.id);

    try {
      const response = await fetch(`/api/supporting-documents/${record.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        window.alert(payload.message || "Gagal menghapus bukti dukung.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("Terjadi gangguan koneksi saat menghapus bukti dukung.");
    } finally {
      setBusyId(null);
    }
  }

  function ActionIconButton({
    children,
    title,
    href,
    target,
    onClick,
    danger = false,
    disabled = false,
  }: {
    children: ReactNode;
    title: string;
    href?: string;
    target?: string;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
  }) {
    const className = `group relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
      danger
        ? "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;

    const tooltip = (
      <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
        {title}
      </span>
    );

    if (href) {
      return (
        <Link href={href} target={target} aria-label={title} className={className}>
          {tooltip}
          {children}
        </Link>
      );
    }

    return (
      <button
        type="button"
        aria-label={title}
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {tooltip}
        {children}
      </button>
    );
  }

  return (
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
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Deskripsi</TableHeaderCell>
              <TableHeaderCell>File</TableHeaderCell>
              <TableHeaderCell>Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.length ? (
              paginatedItems.map((record) => (
                <TableRow key={record.id}>
                  {showEmployee ? (
                    <TableCell>
                      <div className="whitespace-normal break-words font-medium text-slate-950">{record.employee?.name}</div>
                      <div className="text-xs text-slate-400">{record.employee?.nip}</div>
                    </TableCell>
                  ) : null}
                  <TableCell>{periodLabel(record.periodMonth, record.periodYear)}</TableCell>
                  <TableCell><StatusIcon status={record.reviewStatus} /></TableCell>
                  <TableCell><div className="whitespace-normal break-words">{record.description}</div></TableCell>
                  <TableCell><div className="whitespace-normal break-words">{record.fileOriginalName}</div></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {canPreview(record.mimeType) ? (
                        <ActionIconButton
                          href={`/api/supporting-documents/files/${record.id}?mode=preview`}
                          target="_blank"
                          title="Preview file"
                        >
                          <RiEyeLine size={16} />
                        </ActionIconButton>
                      ) : null}
                      <ActionIconButton
                        href={`/api/supporting-documents/files/${record.id}?mode=download`}
                        title="Download file"
                      >
                        <RiDownloadLine size={16} />
                      </ActionIconButton>
                      {canManage ? (
                        <>
                          <ActionIconButton
                            onClick={() => handleEdit(record)}
                            disabled={busyId === record.id}
                            title="Ubah deskripsi"
                          >
                            <RiEdit2Line size={16} />
                          </ActionIconButton>
                          <ActionIconButton
                            onClick={() => handleDelete(record)}
                            disabled={busyId === record.id}
                            title="Hapus file"
                            danger
                          >
                            <RiDeleteBinLine size={16} />
                          </ActionIconButton>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showEmployee ? 6 : 5}>
                  <div className="py-4 text-sm text-slate-500">Belum ada bukti dukung pada filter ini.</div>
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
  );
}
