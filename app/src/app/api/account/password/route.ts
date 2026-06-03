import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireCurrentUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth-password";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const currentPassword = body.currentPassword?.trim() || "";
  const newPassword = body.newPassword?.trim() || "";
  const confirmPassword = body.confirmPassword?.trim() || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { ok: false, message: "Semua field password wajib diisi." },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Password baru minimal 6 karakter." },
      { status: 400 },
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { ok: false, message: "Konfirmasi password baru tidak sama." },
      { status: 400 },
    );
  }

  const isValidCurrentPassword = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValidCurrentPassword) {
    return NextResponse.json(
      { ok: false, message: "Password saat ini tidak sesuai." },
      { status: 401 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Password berhasil diperbarui.",
  });
}
