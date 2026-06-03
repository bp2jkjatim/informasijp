import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          status: "error",
          database: "disconnected",
          message: "DATABASE_URL is not configured",
        },
        { status: 500 },
      );
    }

    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database connection error";

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message,
      },
      { status: 500 },
    );
  }
}
