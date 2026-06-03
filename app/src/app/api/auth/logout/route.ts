import { NextRequest, NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";
import { appPath } from "@/lib/paths";

export async function POST(request: NextRequest) {
  clearUserSession();
  return NextResponse.redirect(new URL(appPath("/login"), request.url), 303);
}
