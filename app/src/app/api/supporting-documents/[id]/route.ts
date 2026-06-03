import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAuthorizedDocument(documentId: number) {
  const user = await requireCurrentUser();

  if (!documentId) {
    return {
      user,
      document: null,
      response: NextResponse.json({ ok: false, message: "ID bukti dukung tidak valid." }, { status: 400 }),
    };
  }

  const document = await prisma.supportingDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return {
      user,
      document: null,
      response: NextResponse.json({ ok: false, message: "Bukti dukung tidak ditemukan." }, { status: 404 }),
    };
  }

  if (user.role !== "admin" && user.employeeId !== document.employeeId) {
    return {
      user,
      document: null,
      response: NextResponse.json({ ok: false, message: "Akses bukti dukung tidak diizinkan." }, { status: 403 }),
    };
  }

  return { user, document, response: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const documentId = Number(params.id);
  const access = await getAuthorizedDocument(documentId);

  if (access.response || !access.document) {
    return access.response;
  }

  const payload = (await request.json()) as { description?: string };
  const description = String(payload.description || "").trim();

  if (!description) {
    return NextResponse.json(
      { ok: false, message: "Deskripsi bukti dukung wajib diisi." },
      { status: 400 },
    );
  }

  await prisma.supportingDocument.update({
    where: { id: access.document.id },
    data: { description },
  });

  return NextResponse.json({
    ok: true,
    message: "Deskripsi bukti dukung berhasil diperbarui.",
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const documentId = Number(params.id);
  const access = await getAuthorizedDocument(documentId);

  if (access.response || !access.document) {
    return access.response;
  }

  const absolutePath = path.join(process.cwd(), access.document.filePath);

  await prisma.supportingDocument.delete({
    where: { id: access.document.id },
  });

  await unlink(absolutePath).catch(() => null);

  return NextResponse.json({
    ok: true,
    message: "Bukti dukung berhasil dihapus.",
  });
}
