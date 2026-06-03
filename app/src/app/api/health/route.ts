import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    app: "informasijp-next",
    status: "ok",
    architecture: "nextjs-fullstack",
    sourceOfTruth: "backend",
  });
}
