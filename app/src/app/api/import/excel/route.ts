import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { importExcelWorkbook } from "@/lib/excel-import";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAdminUser();

  try {
    const result = await importExcelWorkbook();
    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Import gagal dijalankan.",
      },
      { status: 500 },
    );
  }
}
