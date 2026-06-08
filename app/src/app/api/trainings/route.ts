import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import {
  buildStoredUploadPath,
  getUploadsSubdir,
} from "@/lib/uploads";
import { getUploadSizeLimitMessage, isUploadSizeAllowed } from "@/lib/upload-limits";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true";
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const formData = await request.formData();

  const requestedEmployeeId = Number(formData.get("employeeId") || 0);
  const employeeId =
    user.role === "admin" ? requestedEmployeeId : user.employeeId ?? 0;

  if (!employeeId) {
    return NextResponse.json(
      { ok: false, message: "Pegawai tujuan tidak valid." },
      { status: 400 },
    );
  }

  if (user.role !== "admin" && user.employeeId !== employeeId) {
    return NextResponse.json(
      { ok: false, message: "Anda tidak boleh menginput data untuk pegawai lain." },
      { status: 403 },
    );
  }

  const trainingName = String(formData.get("trainingName") || "").trim();
  const trainingProvider = String(formData.get("trainingProvider") || "").trim();
  const trainingDateText = String(formData.get("trainingDateText") || "").trim();
  const certificateNumber = String(formData.get("certificateNumber") || "").trim();
  const certificateLink = String(formData.get("certificateLink") || "").trim();
  const proposedTraining = String(formData.get("proposedTraining") || "").trim();
  const jumlahJp = Number(formData.get("jumlahJp") || 0);
  const year = Number(formData.get("year") || 0);

  if (!trainingName || !jumlahJp || !year) {
    return NextResponse.json(
      { ok: false, message: "Nama diklat, jumlah JP, dan tahun wajib diisi." },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!employee) {
    return NextResponse.json(
      { ok: false, message: "Pegawai tidak ditemukan." },
      { status: 404 },
    );
  }

  let certificateFilePath: string | null = null;
  const certificateFile = formData.get("certificateFile");

  if (certificateFile instanceof File && certificateFile.size > 0) {
    if (!isUploadSizeAllowed(certificateFile.size)) {
      return NextResponse.json(
        { ok: false, message: getUploadSizeLimitMessage("File sertifikat") },
        { status: 400 },
      );
    }

    const uploadsDir = getUploadsSubdir("certificates");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = certificateFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
    const outputPath = path.join(uploadsDir, filename);
    const bytes = await certificateFile.arrayBuffer();

    await writeFile(outputPath, Buffer.from(bytes));
    certificateFilePath = buildStoredUploadPath("certificates", filename);
  }

  await prisma.training.create({
    data: {
      employeeId,
      proposedTraining: proposedTraining || null,
      trainingName,
      trainingDateText: trainingDateText || null,
      trainingProvider: trainingProvider || null,
      certificateNumber: certificateNumber || null,
      certificateFilePath,
      certificateLink: certificateLink || null,
      isPbj: parseBoolean(formData.get("isPbj")),
      isJabatan: parseBoolean(formData.get("isJabatan")),
      isIntegritas: parseBoolean(formData.get("isIntegritas")),
      jumlahJp,
      year,
      createdByUserId: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Data diklat berhasil disimpan.",
  });
}
