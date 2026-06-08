import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";
import { appPath } from "@/lib/paths";

export async function POST() {
  clearUserSession();

  // Use a relative Location so the browser resolves it against the public
  // address (e.g. https://bp2jkjatim.web.id) instead of the app's internal
  // bind address (0.0.0.0:3500) seen behind the reverse proxy.
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: appPath("/login"),
    },
  });
}
