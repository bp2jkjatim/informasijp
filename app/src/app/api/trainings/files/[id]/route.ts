import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    return "application/pdf";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

function getOriginalName(filePath: string) {
  return path.basename(filePath).replace(/^\d+-[a-f0-9-]+-/i, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireCurrentUser();
  const trainingId = Number(params.id);

  if (!trainingId) {
    return NextResponse.json({ message: "ID file tidak valid." }, { status: 400 });
  }

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: {
      employeeId: true,
      certificateFilePath: true,
    },
  });

  if (!training || !training.certificateFilePath) {
    return NextResponse.json({ message: "File sertifikat tidak ditemukan." }, { status: 404 });
  }

  if (user.role !== "admin" && user.employeeId !== training.employeeId) {
    return NextResponse.json({ message: "Akses file tidak diizinkan." }, { status: 403 });
  }

  const mode = request.nextUrl.searchParams.get("mode") || "download";
  const mimeType = getMimeType(training.certificateFilePath);

  if (mode === "preview" && !["application/pdf", "image/png", "image/jpeg"].includes(mimeType)) {
    return NextResponse.json(
      { message: "File ini tidak mendukung preview langsung." },
      { status: 400 },
    );
  }

  const absolutePath = path.join(process.cwd(), training.certificateFilePath);
  const bytes = await readFile(absolutePath);
  const fileName = getOriginalName(training.certificateFilePath);
  const disposition = mode === "preview" ? "inline" : `attachment; filename="${encodeURIComponent(fileName)}"`;

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": disposition,
    },
  });
}
