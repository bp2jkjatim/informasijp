import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStoredUploadPath,
  getUploadsSubdir,
} from "@/lib/uploads";
import { getUploadSizeLimitMessage, isUploadSizeAllowed } from "@/lib/upload-limits";

export const dynamic = "force-dynamic";

const ALLOWED_FILE_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
]);

function parseMonth(raw: FormDataEntryValue | null) {
  const value = Number(raw || 0);
  return Number.isInteger(value) && value >= 1 && value <= 12 ? value : 0;
}

function parseYear(raw: FormDataEntryValue | null) {
  const value = Number(raw || 0);
  return Number.isInteger(value) && value >= 2000 && value <= 2100 ? value : 0;
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const formData = await request.formData();

  const requestedEmployeeId = Number(formData.get("employeeId") || 0);
  const employeeId = user.role === "admin" ? requestedEmployeeId : user.employeeId ?? 0;
  const periodMonth = parseMonth(formData.get("periodMonth"));
  const periodYear = parseYear(formData.get("periodYear"));
  const description = String(formData.get("description") || "").trim();
  const uploadedFile = formData.get("file");

  if (!employeeId || !periodMonth || !periodYear || !description) {
    return NextResponse.json(
      { ok: false, message: "Pegawai, periode, dan deskripsi wajib diisi." },
      { status: 400 },
    );
  }

  if (user.role !== "admin" && user.employeeId !== employeeId) {
    return NextResponse.json(
      { ok: false, message: "Anda tidak boleh mengunggah bukti dukung untuk pegawai lain." },
      { status: 403 },
    );
  }

  if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
    return NextResponse.json(
      { ok: false, message: "File bukti dukung wajib diunggah." },
      { status: 400 },
    );
  }

  if (!isUploadSizeAllowed(uploadedFile.size)) {
    return NextResponse.json(
      { ok: false, message: getUploadSizeLimitMessage("File bukti dukung") },
      { status: 400 },
    );
  }

  const extension = path.extname(uploadedFile.name).toLowerCase();

  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Format file tidak didukung. Gunakan Excel, Word, image, atau PDF.",
      },
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

  const uploadsDir = getUploadsSubdir("supporting-documents");
  await mkdir(uploadsDir, { recursive: true });

  const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const outputPath = path.join(uploadsDir, storedName);
  const bytes = await uploadedFile.arrayBuffer();

  await writeFile(outputPath, Buffer.from(bytes));

  await prisma.supportingDocument.create({
    data: {
      employeeId,
      periodMonth,
      periodYear,
      description,
      fileOriginalName: uploadedFile.name,
      fileStoredName: storedName,
      filePath: buildStoredUploadPath("supporting-documents", storedName),
      mimeType: uploadedFile.type || null,
      createdByUserId: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Bukti dukung berhasil disimpan.",
  });
}
