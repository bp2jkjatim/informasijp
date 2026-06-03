"use client";

import Link from "next/link";
import {
  RiArrowRightUpLine,
  RiFileList2Line,
  RiInboxArchiveLine,
} from "@remixicon/react";
import { Badge, Card, ProgressBar, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react";
import { MetricCard } from "@/components/metric-card";
import { ShellFrame } from "@/components/shell-frame";
import { PaginationControls, useTablePagination } from "@/components/table-pagination";

type EmployeeDashboardProps = {
  user: {
    username: string;
    role: string;
    name: string;
    jobTitle: string;
  };
  summary: {
    activePeriodMonth: number;
    activePeriodYear: number;
    jpTarget: number;
    trainingCount: number;
    totalJp: number;
    pbjJp: number;
    jabatanJp: number;
    integritasJp: number;
    pbjStatus: "fulfilled" | "missing";
    jabatanStatus: "fulfilled" | "missing";
    integritasStatus: "fulfilled" | "missing";
    latestTrainings: Array<{
      id: number;
      trainingName: string;
      trainingProvider: string | null;
      jumlahJp: number | { toString(): string };
      year: number;
    }>;
    activePeriodSupportingDocumentsCount: number;
    activePeriodSupportingDocuments: Array<{
      id: number;
      fileOriginalName: string;
      description: string;
    }>;
    activePeriodSupportStatus: "reviewed" | "uploaded" | "missing";
    latestSupportReview: {
      periodMonth: number;
      periodYear: number;
      comment: string | null;
      reviewedAt: Date | null;
      reviewedByLabel: string | null;
    } | null;
  };
};

function getPeriodLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatReviewedAt(reviewedAt: Date | null) {
  if (!reviewedAt) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(reviewedAt);
}

export function EmployeeDashboard({ user, summary }: EmployeeDashboardProps) {
  const activePeriodLabel = getPeriodLabel(summary.activePeriodMonth, summary.activePeriodYear);
  const latestReviewLabel = summary.latestSupportReview
    ? getPeriodLabel(summary.latestSupportReview.periodMonth, summary.latestSupportReview.periodYear)
    : activePeriodLabel;
  const jpProgress = Math.min((summary.totalJp / Math.max(summary.jpTarget, 1)) * 100, 100);
  const supportStatusLabel =
    summary.activePeriodSupportStatus === "reviewed"
      ? "Sudah direview"
      : summary.activePeriodSupportStatus === "uploaded"
        ? "Sudah upload"
        : "Belum upload";
  const supportStatusColor =
    summary.activePeriodSupportStatus === "reviewed"
      ? "emerald"
      : summary.activePeriodSupportStatus === "uploaded"
        ? "blue"
        : "amber";
  const categoryItems = [
    {
      label: "PBJ",
      jp: summary.pbjJp,
      status: summary.pbjStatus,
    },
    {
      label: "Jabatan",
      jp: summary.jabatanJp,
      status: summary.jabatanStatus,
    },
    {
      label: "Integritas",
      jp: summary.integritasJp,
      status: summary.integritasStatus,
    },
  ];
  const latestTrainingRows = useTablePagination({
    items: summary.latestTrainings,
    pageSize: 5,
  });

  return (
    <ShellFrame
      eyebrow="Employee Workspace"
      title="Panel pegawai untuk input dan monitoring pribadi"
      description="Area ini menampilkan capaian JP, status bukti dukung periode aktif, dan masukan admin terbaru untuk akun Anda."
      currentUser={user}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total JP"
          value={`${summary.totalJp}`}
          detail={`Target pribadi ${summary.jpTarget} JP`}
          progress={jpProgress}
        />
        <MetricCard
          label="Jumlah Diklat"
          value={`${summary.trainingCount}`}
          detail="Riwayat diklat tersimpan"
          progress={Math.min(summary.trainingCount * 10, 100)}
        />
        <MetricCard
          label="Bukti Dukung Aktif"
          value={`${summary.activePeriodSupportingDocumentsCount}`}
          detail={`${supportStatusLabel} pada ${activePeriodLabel}`}
          progress={
            summary.activePeriodSupportStatus === "reviewed"
              ? 100
              : summary.activePeriodSupportStatus === "uploaded"
                ? 70
                : 10
          }
        />
        <MetricCard
          label="Akun Aktif"
          value={user.name}
          detail={user.jobTitle}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="planner-card rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
                Monitoring Pribadi
              </Text>
              <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
                Status pemenuhan periode aktif
              </Title>
            </div>
            <Badge color={supportStatusColor}>{supportStatusLabel}</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Progress JP
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {summary.totalJp} / {summary.jpTarget}
              </div>
              <div className="mt-4">
                <ProgressBar value={jpProgress} color="blue" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Total JP akan bertambah dari data diklat yang Anda input dan valid di sistem.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Bukti Dukung Periode Aktif
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {summary.activePeriodSupportingDocumentsCount} file
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Periode aktif saat ini adalah {activePeriodLabel}. Pastikan semua bukti dukung yang relevan sudah diunggah.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/pegawai/bukti-dukung" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <RiInboxArchiveLine size={16} className="mr-2" />
                  Buka bukti dukung
                </Link>
                <Link href="/pegawai/diklat" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <RiFileList2Line size={16} className="mr-2" />
                  Buka diklat
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="planner-card rounded-[28px] p-6 shadow-none">
            <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
              Masukan Atasan
            </Text>
            <Title className="!mt-3 !text-xl !font-semibold !tracking-tight !text-slate-950">
              Comment terakhir
            </Title>
            <div className="mt-4 rounded-3xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">{latestReviewLabel}</span>
                <span className="text-xs text-slate-400">
                  {summary.latestSupportReview?.reviewedByLabel || "-"} · {formatReviewedAt(summary.latestSupportReview?.reviewedAt || null)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {summary.latestSupportReview?.comment?.trim()
                  ? summary.latestSupportReview.comment
                  : "Belum ada masukan atasan yang tersimpan untuk periode Anda."}
              </p>
            </div>
          </Card>

          <Card className="planner-card rounded-[28px] p-6 shadow-none">
            <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
              File Aktif
            </Text>
            <Title className="!mt-3 !text-xl !font-semibold !tracking-tight !text-slate-950">
              Bukti dukung periode {activePeriodLabel}
            </Title>
            <div className="mt-4 space-y-3">
              {summary.activePeriodSupportingDocuments.length ? (
                summary.activePeriodSupportingDocuments.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{document.fileOriginalName}</div>
                    <div className="mt-1 text-sm text-slate-500">{document.description}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 px-4 py-4 text-sm text-slate-500">
                  Belum ada file bukti dukung pada periode aktif.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="planner-card mt-4 rounded-[28px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
              Validasi Bisnis JP
            </Text>
            <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
              Status kategori diklat
            </Title>
          </div>
          <Link
            href="/pegawai/diklat"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RiArrowRightUpLine size={16} className="mr-2" />
            Lengkapi kategori
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {categoryItems.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">{item.label}</span>
                <Badge color={item.status === "fulfilled" ? "emerald" : "amber"}>
                  {item.status === "fulfilled" ? "Terpenuhi" : "Belum terpenuhi"}
                </Badge>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {item.jp} JP
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.status === "fulfilled"
                  ? `Sudah ada akumulasi JP untuk kategori ${item.label}.`
                  : `Belum ada diklat yang ditandai ke kategori ${item.label}.`}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="planner-card mt-4 rounded-[28px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-400">
              Riwayat Singkat
            </Text>
            <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
              Diklat terbaru
            </Title>
          </div>
          <Link
            href="/pegawai/diklat"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RiArrowRightUpLine size={16} className="mr-2" />
            Kelola diklat
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Diklat</TableHeaderCell>
                <TableHeaderCell>JP</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {latestTrainingRows.paginatedItems.length ? (
                latestTrainingRows.paginatedItems.map((training) => (
                  <TableRow key={training.id}>
                    <TableCell>
                      <div className="font-medium text-slate-950">{training.trainingName}</div>
                      <div className="text-xs text-slate-400">
                        {training.trainingProvider || "Penyelenggara belum diisi"} · {training.year}
                      </div>
                    </TableCell>
                    <TableCell>{Number(training.jumlahJp)} JP</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2}>
                    <p className="py-4 text-sm leading-6 text-slate-500">
                      Belum ada data diklat tersimpan untuk pegawai ini.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {latestTrainingRows.hasPagination ? (
          <PaginationControls
            currentPage={latestTrainingRows.currentPage}
            totalPages={latestTrainingRows.totalPages}
            onPrevious={latestTrainingRows.goToPreviousPage}
            onNext={latestTrainingRows.goToNextPage}
          />
        ) : null}
      </Card>
    </ShellFrame>
  );
}
