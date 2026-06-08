import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser, getUserHomePath } from "@/lib/auth";
import { appPath } from "@/lib/paths";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getUserHomePath(user.role));
  }

  const backgroundImage = appPath("/login-bg.jpg");
  const logo = appPath("/logo-pu.jpg");

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.8), rgba(248, 250, 252, 0.8)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-md md:p-10">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="Logo Kementerian PU"
            className="h-20 w-20 object-contain"
          />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
            SISDM
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Sistem Informasi SDM
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            BP2JK Wilayah Jawa Timur
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
