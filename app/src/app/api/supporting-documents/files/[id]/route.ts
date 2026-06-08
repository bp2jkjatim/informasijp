import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPreviewableMimeType } from "@/lib/supporting-documents";
import { resolveStoredUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireCurrentUser();
  const documentId = Number(params.id);

  if (!documentId) {
    return NextResponse.json({ message: "ID file tidak valid." }, { status: 400 });
  }

  const document = await prisma.supportingDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return NextResponse.json({ message: "File bukti dukung tidak ditemukan." }, { status: 404 });
  }

  if (user.role !== "admin" && user.employeeId !== document.employeeId) {
    return NextResponse.json({ message: "Akses file tidak diizinkan." }, { status: 403 });
  }

  const mode = request.nextUrl.searchParams.get("mode") || "download";

  if (mode === "preview" && !isPreviewableMimeType(document.mimeType)) {
    return NextResponse.json(
      { message: "File ini tidak mendukung preview langsung." },
      { status: 400 },
    );
  }

  const absolutePath = resolveStoredUploadPath(document.filePath);
  const bytes = await readFile(absolutePath);
  const disposition =
    mode === "preview" ? "inline" : `attachment; filename="${encodeURIComponent(document.fileOriginalName)}"`;

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": disposition,
    },
  });
}
