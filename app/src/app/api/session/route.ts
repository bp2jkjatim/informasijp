import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      employee: user.employee
        ? {
            id: user.employee.id,
            nip: user.employee.nip,
            name: user.employee.name,
            jobTitle: user.employee.jobTitle,
            employmentState: user.employee.employmentState,
          }
        : null,
    },
  });
}
