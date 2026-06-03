import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  const body = (await request.json()) as {
    employeeId?: number;
    periodMonth?: number;
    periodYear?: number;
    comment?: string;
  };

  const employeeId = Number(body.employeeId || 0);
  const periodMonth = Number(body.periodMonth || 0);
  const periodYear = Number(body.periodYear || 0);
  const comment = String(body.comment || "").trim();

  if (!employeeId || !periodMonth || !periodYear) {
    return NextResponse.json(
      { ok: false, message: "Pegawai dan periode validasi wajib dipilih." },
      { status: 400 },
    );
  }

  await prisma.supportingDocumentPeriodReview.upsert({
    where: {
      employeeId_periodYear_periodMonth: {
        employeeId,
        periodYear,
        periodMonth,
      },
    },
    update: {
      comment: comment || null,
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    },
    create: {
      employeeId,
      periodMonth,
      periodYear,
      comment: comment || null,
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Masukan validasi periode berhasil disimpan.",
  });
}
