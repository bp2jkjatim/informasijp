"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Card, Text } from "@tremor/react";
import {
  RiArrowLeftSLine,
  RiArrowRightUpLine,
  RiBarChartBoxLine,
  RiDownloadCloud2Line,
  RiArchiveDrawerLine,
  RiLockPasswordLine,
  RiDatabase2Line,
  RiFileList2Line,
  RiSettings3Line,
} from "@remixicon/react";

type ShellFrameProps = {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  currentUser?: {
    username: string;
    role: string;
    name: string;
    jobTitle: string;
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof RiBarChartBoxLine;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export function ShellFrame({
  title,
  eyebrow,
  description,
  children,
  currentUser,
}: ShellFrameProps) {
  const pathname = usePathname();
  const navSections: NavSection[] = currentUser
    ? currentUser.role === "admin"
      ? [
          {
            title: "Menu Pegawai",
            items: [
              { href: "/pegawai", label: "Dashboard Pegawai", icon: RiDatabase2Line },
              { href: "/pegawai/diklat", label: "Riwayat Diklat", icon: RiFileList2Line },
              { href: "/pegawai/bukti-dukung", label: "Bukti Dukung", icon: RiArchiveDrawerLine },
              { href: "/pegawai/password", label: "Ganti Password", icon: RiLockPasswordLine },
            ],
          },
          {
            title: "Menu Admin",
            items: [
              { href: "/admin", label: "Dashboard Admin", icon: RiBarChartBoxLine },
              { href: "/admin/diklat", label: "Kelola Diklat", icon: RiFileList2Line },
              { href: "/admin/import", label: "Import Data", icon: RiDownloadCloud2Line },
              { href: "/admin/validasi-bukti-dukung", label: "Validasi Dokumen", icon: RiArchiveDrawerLine },
            ],
          },
        ]
      : [
          {
            title: "Workspace",
            items: [
              { href: "/pegawai", label: "Dashboard", icon: RiBarChartBoxLine },
              { href: "/pegawai/diklat", label: "Riwayat Diklat", icon: RiFileList2Line },
              { href: "/pegawai/bukti-dukung", label: "Bukti Dukung", icon: RiArchiveDrawerLine },
              { href: "/pegawai/password", label: "Ganti Password", icon: RiLockPasswordLine },
            ],
          },
        ]
    : [
        {
          title: "Workspace",
          items: [{ href: "/login", label: "Login", icon: RiBarChartBoxLine }],
        },
      ];

  return (
    <main className="min-h-screen bg-[#f8fafc] px-2 py-2 text-slate-900 md:px-3">
      <div className="mx-auto grid min-h-[calc(100vh-1rem)] max-w-[1600px] gap-2 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="planner-sidebar flex flex-col rounded-[26px] px-3 py-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-2.5 py-2.5">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Informasi JP
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950">
                Planning Workspace
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
            >
              <RiArrowLeftSLine size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {section.title}
                </div>
                <nav className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`planner-nav-item ${active ? "planner-nav-item-active" : ""}`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={18} />
                          {item.label}
                        </span>
                        <RiArrowRightUpLine size={15} className="text-slate-400" />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {currentUser ? (
            <Card className="planner-card mt-auto rounded-[24px] p-3 shadow-none">
              <Text className="!text-sm !font-semibold !text-slate-950">{currentUser.name}</Text>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {currentUser.username} · {currentUser.role} · {currentUser.jobTitle}
              </p>
              <form action="/api/auth/logout" method="post" className="mt-3">
                <button
                  type="submit"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Logout
                </button>
              </form>
            </Card>
          ) : (
            <Card className="planner-card mt-auto rounded-[24px] p-3 shadow-none">
              <Text className="!font-semibold !text-slate-950">Arsitektur aktif</Text>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Existing app tetap aman. Pengembangan aktif bergerak ke folder
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-900">
                  /app
                </code>
                dengan backend dan frontend dalam satu jalur.
              </p>
            </Card>
          )}
        </aside>

        <section className="planner-main rounded-[26px] px-3 py-3 md:px-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-slate-500">{eyebrow}</span>
              </div>
              <h1 className="mt-1.5 text-[30px] font-semibold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-500">
                {description}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
              >
                <RiSettings3Line size={16} />
                Workspace
              </button>
            </div>
          </div>

          <div className="mt-4">{children}</div>
        </section>
      </div>
    </main>
  );
}
