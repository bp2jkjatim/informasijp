"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import {
  RiAwardLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiGovernmentLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { Callout, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react";
import { PaginationControls, useTablePagination } from "@/components/table-pagination";
import { appPath } from "@/lib/paths";

type TrainingRecord = {
  id: number;
  trainingName: string;
  trainingProvider: string | null;
  trainingDateText: string | null;
  certificateNumber: string | null;
  certificateFilePath: string | null;
  certificateLink: string | null;
  jumlahJp: number | { toString(): string };
  year: number;
  isPbj: boolean;
  isJabatan: boolean;
  isIntegritas: boolean;
  employee: {
    id: number;
    nip: string;
    name: string;
  };
  createdByUser: {
    username: string;
  } | null;
};

type TrainingRecordsTableProps = {
  title: string;
  description: string;
  records: TrainingRecord[];
  baseEditPath: string;
  canManageAllEmployees: boolean;
};

function StatusMarker({
  active,
  title,
  children,
}: {
  active: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white text-slate-400"
      }`}
      title={title}
    >
      <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
        {title}
      </span>
      {children}
    </span>
  );
}

export function TrainingRecordsTable({
  title,
  description,
  records,
  baseEditPath,
  canManageAllEmployees,
}: TrainingRecordsTableProps) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const {
    currentPage,
    totalPages,
    paginatedItems,
    hasPagination,
    goToPreviousPage,
    goToNextPage,
  } = useTablePagination({ items: records, pageSize: 10 });

  async function handleDelete(id: number) {
    setDeletingId(id);
    setSubmitState("");

    try {
      const response = await fetch(appPath(`/api/trainings/${id}`), {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setSubmitState(payload.message || "Data gagal dihapus.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSubmitState("Terjadi gangguan koneksi saat menghapus data.");
    } finally {
      setDeletingId(null);
    }
  }

  function ActionIconButton({
    children,
    title,
    href,
    onClick,
    danger = false,
    disabled = false,
  }: {
    children: ReactNode;
    title: string;
    href?: string;
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
        <Link href={href} aria-label={title} className={className}>
          {tooltip}
          {children}
        </Link>
      );
    }

    return (
      <button
        type="button"
        title={title}
        aria-label={title}
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
    <Card className="planner-card rounded-[28px] p-5">
      <Title className="!text-2xl !font-semibold !tracking-tight !text-slate-950">
        {title}
      </Title>
      <Text className="!mt-2 !text-sm !leading-6 !text-slate-700">
        {description}
      </Text>

      {submitState ? (
        <Callout className="mt-4" color="rose" title="Gagal">
          {submitState}
        </Callout>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300">
        <Table className="w-full table-fixed">
          <colgroup>
            {canManageAllEmployees ? <col className="w-[18%]" /> : null}
            <col className={canManageAllEmployees ? "w-[26%]" : "w-[34%]"} />
            <col className={canManageAllEmployees ? "w-[20%]" : "w-[24%]"} />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[14%]" />
          </colgroup>
          <TableHead>
            <TableRow>
              {canManageAllEmployees ? <TableHeaderCell>Pegawai</TableHeaderCell> : null}
              <TableHeaderCell>Diklat</TableHeaderCell>
              <TableHeaderCell>Provider</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>JP</TableHeaderCell>
              <TableHeaderCell>Tahun</TableHeaderCell>
              <TableHeaderCell>Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.length ? (
              paginatedItems.map((record) => (
                <TableRow key={record.id}>
                  {canManageAllEmployees ? (
                    <TableCell>
                      <div className="whitespace-normal break-words font-medium text-slate-950">
                        {record.employee.name}
                      </div>
                      <div className="mt-1 whitespace-normal break-words text-xs text-slate-500">
                        {record.employee.nip}
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="whitespace-normal break-words font-medium text-slate-950">
                      {record.trainingName}
                    </div>
                    <div className="mt-1 whitespace-normal break-words text-xs text-slate-500">
                      {record.trainingDateText || "Tanggal belum diisi"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-normal break-words">
                      {record.trainingProvider || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <StatusMarker active={record.isPbj} title="Kategori PBJ">
                        <RiGovernmentLine size={16} />
                      </StatusMarker>
                      <StatusMarker active={record.isJabatan} title="Kategori Jabatan">
                        <RiAwardLine size={16} />
                      </StatusMarker>
                      <StatusMarker active={record.isIntegritas} title="Kategori Integritas">
                        <RiShieldCheckLine size={16} />
                      </StatusMarker>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-normal break-words">{Number(record.jumlahJp)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-normal break-words">{record.year}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <ActionIconButton
                        href={`${baseEditPath}/${record.id}`}
                        title="Edit data diklat"
                      >
                        <RiEdit2Line size={16} />
                      </ActionIconButton>
                      <ActionIconButton
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id && isPending}
                        title="Hapus data diklat"
                        danger
                      >
                        <RiDeleteBinLine size={16} />
                      </ActionIconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canManageAllEmployees ? 7 : 6}>
                  <div className="py-4 text-sm text-pu-800/70">
                    Belum ada data diklat yang tersimpan.
                  </div>
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
