import { ChangePasswordForm } from "@/components/change-password-form";
import { ShellFrame } from "@/components/shell-frame";
import { requireCurrentUser } from "@/lib/auth";

export default async function PasswordPage() {
  const user = await requireCurrentUser();

  return (
    <ShellFrame
      eyebrow="Account Workspace"
      title="Pengaturan password"
      description="Halaman ini disediakan sebagai menu penggantian password mandiri. Sistem tidak memaksa pengguna mengganti password pada login pertama."
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <ChangePasswordForm />
    </ShellFrame>
  );
}
