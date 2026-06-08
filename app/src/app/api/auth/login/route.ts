import { NextRequest, NextResponse } from "next/server";
import { createUserSession, getUserHomePath } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth-password";
import { verifyCaptcha } from "@/lib/captcha";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
    captcha?: string;
  };

  const username = body.username?.trim();
  const password = body.password?.trim();

  if (!verifyCaptcha(body.captcha)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Kode captcha salah atau sudah kedaluwarsa.",
      },
      { status: 400 },
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      {
        ok: false,
        message: "Username dan password wajib diisi.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      employee: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      {
        ok: false,
        message: "Akun tidak ditemukan atau tidak aktif.",
      },
      { status: 401 },
    );
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return NextResponse.json(
      {
        ok: false,
        message: "Password tidak sesuai.",
      },
      { status: 401 },
    );
  }

  await createUserSession(user.id);

  return NextResponse.json({
    ok: true,
    redirectTo: getUserHomePath(user.role),
  });
}
