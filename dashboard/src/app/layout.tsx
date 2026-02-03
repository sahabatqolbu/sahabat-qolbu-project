// dashboard/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/ui/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard - Sahabat Qolbu",
  description: "Sistem Manajemen Umrah & Haji - Sahabat Qolbu Travel",
  keywords: ["umrah", "haji", "travel", "sahabat qolbu"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
        suppressHydrationWarning // ✅ TAMBAH INI
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
