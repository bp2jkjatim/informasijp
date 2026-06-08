import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "SISDM BP2JK Wilayah Jawa Timur",
  description: "Sistem Informasi SDM BP2JK Wilayah Jawa Timur.",
  icons: {
    icon: `${basePath}/logo-pu.jpg`,
    shortcut: `${basePath}/logo-pu.jpg`,
    apple: `${basePath}/logo-pu.jpg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="font-[family-name:var(--font-geist-sans)] antialiased"
      >
        {children}
      </body>
    </html>
  );
}
