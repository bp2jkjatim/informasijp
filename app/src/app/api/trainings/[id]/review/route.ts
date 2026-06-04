import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireAdminUser();
  const trainingId = Number(params.id);

  if (!trainingId) {
    return NextResponse.json({ ok: false, message: "ID diklat tidak valid." }, { status: 400 });
  }

  const body = (await request.json()) as {
    action?: string;
    note?: string;
  };
  const action = body.action === "verified" ? "verified" : body.action === "rejected" ? "rejected" : "";
  const note = String(body.note || "").trim();

  if (!action) {
    return NextResponse.json({ ok: false, message: "Status verifikasi tidak valid." }, { status: 400 });
  }

  if (action === "rejected" && !note) {
    return NextResponse.json({ ok: false, message: "Catatan penolakan wajib diisi." }, { status: 400 });
  }

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true },
  });

  if (!training) {
    return NextResponse.json({ ok: false, message: "Data diklat tidak ditemukan." }, { status: 404 });
  }

  await prisma.training.update({
    where: { id: trainingId },
    data: {
      verificationStatus: action,
      verificationNote: action === "rejected" ? note : null,
      verifiedByUserId: user.id,
      verifiedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: action === "verified" ? "Diklat berhasil diverifikasi." : "Diklat berhasil ditolak.",
  });
}
