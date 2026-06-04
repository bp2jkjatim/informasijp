import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireCurrentUser } from "@/lib/auth";
import { getTrainingExportRecords } from "@/lib/trainings";

export const dynamic = "force-dynamic";

function parsePositiveInt(raw: string | null) {
  const value = Number(raw || 0);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export async function GET(request: NextRequest) {
  const user = await requireCurrentUser();
  const requestedEmployeeId = parsePositiveInt(request.nextUrl.searchParams.get("employeeId"));
  const requestedYear = parsePositiveInt(request.nextUrl.searchParams.get("year"));

  const employeeId = user.role === "admin" ? requestedEmployeeId : user.employeeId ?? undefined;

  if (user.role !== "admin" && requestedEmployeeId && requestedEmployeeId !== user.employeeId) {
    return NextResponse.json(
      { ok: false, message: "Anda tidak boleh mengekspor data diklat pegawai lain." },
      { status: 403 },
    );
  }

  const records = await getTrainingExportRecords({
    employeeId,
    year: requestedYear,
  });

  const rows = records.map((record, index) => ({
    No: index + 1,
    NIP: record.employee.nip,
    Nama: record.employee.name,
    Jabatan: record.employee.jobTitle || "-",
    Diklat: record.trainingName,
    Provider: record.trainingProvider || "-",
    Tanggal: record.trainingDateText || "-",
    "No Sertifikat": record.certificateNumber || "-",
    "Jumlah JP": Number(record.jumlahJp),
    Tahun: record.year,
    StatusVerifikasi:
      record.verificationStatus === "verified"
        ? "Verified"
        : record.verificationStatus === "rejected"
          ? "Rejected"
          : "Need verification",
    CatatanVerifikasi: record.verificationNote || "-",
    PBJ: record.isPbj ? "Ya" : "Tidak",
    JabatanFlag: record.isJabatan ? "Ya" : "Tidak",
    Integritas: record.isIntegritas ? "Ya" : "Tidak",
    InputOleh: record.createdByUser?.username || "-",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Diklat");

  const fileBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  const fileNameParts = [
    "rekap-diklat",
    employeeId ? `pegawai-${employeeId}` : "semua-pegawai",
    requestedYear ? `tahun-${requestedYear}` : "semua-tahun",
  ];

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileNameParts.join("-")}.xlsx"`,
    },
  });
}
