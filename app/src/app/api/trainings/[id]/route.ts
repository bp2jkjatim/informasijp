import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTrainingCertificateRelativePath,
  getUploadsSubdir,
  resolveStoredUploadPath,
  sanitizeUploadPathSegment,
} from "@/lib/uploads";
import { getUploadSizeLimitMessage, isUploadSizeAllowed } from "@/lib/upload-limits";

export const dynamic = "force-dynamic";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true";
}

async function saveCertificateFile(file: File, nip: string, year: number) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const uploadsDir = getUploadsSubdir(
    "certificates",
    sanitizeUploadPathSegment(nip),
    String(year),
  );
  await mkdir(uploadsDir, { recursive: true });
  const outputPath = path.join(uploadsDir, filename);
  const bytes = await file.arrayBuffer();

  await writeFile(outputPath, Buffer.from(bytes));
  return getTrainingCertificateRelativePath(nip, year, filename);
}

async function assertTrainingAccess(trainingId: number, userId: number, role: string, employeeId: number | null) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
  });

  if (!training) {
    return null;
  }

  if (role !== "admin" && training.employeeId !== employeeId) {
    return false;
  }

  return training;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireCurrentUser();
  const trainingId = Number(params.id);

  if (!trainingId) {
    return NextResponse.json({ ok: false, message: "ID diklat tidak valid." }, { status: 400 });
  }

  const training = await assertTrainingAccess(trainingId, user.id, user.role, user.employeeId);

  if (training === null) {
    return NextResponse.json({ ok: false, message: "Data diklat tidak ditemukan." }, { status: 404 });
  }

  if (training === false) {
    return NextResponse.json({ ok: false, message: "Anda tidak boleh mengubah data ini." }, { status: 403 });
  }

  const formData = await request.formData();
  const requestedEmployeeId = Number(formData.get("employeeId") || 0);
  const employeeId = user.role === "admin" ? requestedEmployeeId || training.employeeId : user.employeeId ?? training.employeeId;
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

  let certificateFilePath = training.certificateFilePath;
  const certificateFile = formData.get("certificateFile");
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, nip: true },
  });

  if (!employee) {
    return NextResponse.json(
      { ok: false, message: "Pegawai tidak ditemukan." },
      { status: 404 },
    );
  }

  if (certificateFile instanceof File && certificateFile.size > 0) {
    if (!isUploadSizeAllowed(certificateFile.size)) {
      return NextResponse.json(
        { ok: false, message: getUploadSizeLimitMessage("File sertifikat") },
        { status: 400 },
      );
    }

    const newPath = await saveCertificateFile(certificateFile, employee.nip, year);

    if (training.certificateFilePath) {
      const previousPath = resolveStoredUploadPath(training.certificateFilePath);

      await unlink(previousPath).catch(() => undefined);
    }

    certificateFilePath = newPath;
  }

  await prisma.training.update({
    where: { id: trainingId },
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
      ...(user.role === "admin"
        ? {}
        : {
            verificationStatus: "need_verification",
            verificationNote: null,
            verifiedByUserId: null,
            verifiedAt: null,
          }),
    },
  });

  return NextResponse.json({ ok: true, message: "Data diklat berhasil diperbarui." });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireCurrentUser();
  const trainingId = Number(params.id);

  if (!trainingId) {
    return NextResponse.json({ ok: false, message: "ID diklat tidak valid." }, { status: 400 });
  }

  const training = await assertTrainingAccess(trainingId, user.id, user.role, user.employeeId);

  if (training === null) {
    return NextResponse.json({ ok: false, message: "Data diklat tidak ditemukan." }, { status: 404 });
  }

  if (training === false) {
    return NextResponse.json({ ok: false, message: "Anda tidak boleh menghapus data ini." }, { status: 403 });
  }

  await prisma.training.delete({
    where: { id: trainingId },
  });

  if (training.certificateFilePath) {
    const previousPath = resolveStoredUploadPath(training.certificateFilePath);
    await unlink(previousPath).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, message: "Data diklat berhasil dihapus." });
}
