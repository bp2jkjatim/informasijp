import { redirect } from "next/navigation";
import { Badge, Card, Text, Title } from "@tremor/react";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser, getUserHomePath } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getUserHomePath(user.role));
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-3 py-3 md:px-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1400px] gap-3 lg:grid-cols-[minmax(0,1.1fr)_420px]">
        <Card className="planner-main flex flex-col justify-between rounded-[28px] p-6 md:p-7">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Home</span>
              <span>/</span>
              <span className="text-slate-500">Secure Access</span>
            </div>
            <Title className="!mt-4 !text-4xl !font-semibold !tracking-tight !text-slate-950 md:!text-5xl">
              Login admin dan pegawai dalam satu app.
            </Title>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
              Fondasi auth sudah tersambung ke database hasil seed. Struktur halaman ini
              mengikuti bahasa visual Planner: ringan, terang, dan fokus pada operasi
              harian tanpa dark mode.
            </p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="planner-card rounded-[28px] p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Access Rules
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">
                    Kredensial bootstrap
                  </div>
                </div>
                <Badge color="blue">Light Only</Badge>
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
                <div className="grid grid-cols-[1.2fr_1fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  <div>Jenis Akun</div>
                  <div>Kredensial Awal</div>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                  <div>Admin</div>
                  <div>NIP / NIP</div>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                  <div>Pegawai</div>
                  <div>NIP / NIP</div>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] px-4 py-4 text-sm text-slate-700">
                  <div>Outsourcing</div>
                  <div>Alias / Alias</div>
                </div>
              </div>
            </div>

            <div className="planner-card rounded-[28px] p-5">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Workspace Notes
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-3xl border border-slate-200 px-4 py-4">
                  <Text className="!text-slate-500">Mode tampilan</Text>
                  <div className="mt-1 text-base font-semibold text-slate-950">Light only, tanpa night mode</div>
                </div>
                <div className="rounded-3xl border border-slate-200 px-4 py-4">
                  <Text className="!text-slate-500">Arah template</Text>
                  <div className="mt-1 text-base font-semibold text-slate-950">Planner-style shell dan data cards</div>
                </div>
                <div className="rounded-3xl border border-slate-200 px-4 py-4">
                  <Text className="!text-slate-500">Login pertama</Text>
                  <div className="mt-1 text-base font-semibold text-slate-950">Tidak wajib ganti password</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <LoginForm />
      </div>
    </main>
  );
}
