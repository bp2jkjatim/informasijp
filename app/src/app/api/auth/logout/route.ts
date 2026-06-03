import { NextRequest, NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  clearUserSession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
