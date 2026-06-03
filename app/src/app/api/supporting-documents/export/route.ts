import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireCurrentUser } from "@/lib/auth";
import { getPeriodLabel, getSupportingDocumentExportRecords } from "@/lib/supporting-documents";

export const dynamic = "force-dynamic";

function parsePositiveInt(raw: string | null) {
  const value = Number(raw || 0);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export async function GET(request: NextRequest) {
  const user = await requireCurrentUser();
  const requestedEmployeeId = parsePositiveInt(request.nextUrl.searchParams.get("employeeId"));
  const requestedPeriodMonth = parsePositiveInt(request.nextUrl.searchParams.get("periodMonth"));
  const requestedPeriodYear = parsePositiveInt(request.nextUrl.searchParams.get("periodYear"));

  const employeeId = user.role === "admin" ? requestedEmployeeId : user.employeeId ?? undefined;

  if (user.role !== "admin" && requestedEmployeeId && requestedEmployeeId !== user.employeeId) {
    return NextResponse.json(
      { ok: false, message: "Anda tidak boleh mengekspor bukti dukung pegawai lain." },
      { status: 403 },
    );
  }

  const records = await getSupportingDocumentExportRecords({
    employeeId,
    periodMonth: requestedPeriodMonth,
    periodYear: requestedPeriodYear,
  });

  const rows = records.map((record, index) => ({
    No: index + 1,
    NIP: record.employee.nip,
    Nama: record.employee.name,
    Jabatan: record.employee.jobTitle || "-",
    Periode: getPeriodLabel(record.periodMonth, record.periodYear),
    Deskripsi: record.description,
    File: record.fileOriginalName,
    "Tipe File": record.mimeType || "-",
    "Status Review": record.reviewStatus === "reviewed" ? "Sudah direview" : "Belum direview",
    "Masukan Atasan": record.reviewComment || "-",
    Reviewer: record.reviewedByLabel || "-",
    "Waktu Review": record.reviewedAt
      ? new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }).format(record.reviewedAt)
      : "-",
    "Input Oleh": record.createdByUser?.username || "-",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bukti Dukung");

  const fileBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  const fileNameParts = [
    "rekap-bukti-dukung",
    employeeId ? `pegawai-${employeeId}` : "semua-pegawai",
    requestedPeriodYear ? `tahun-${requestedPeriodYear}` : "semua-tahun",
    requestedPeriodMonth ? `bulan-${requestedPeriodMonth}` : "semua-bulan",
  ];

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileNameParts.join("-")}.xlsx"`,
    },
  });
}
