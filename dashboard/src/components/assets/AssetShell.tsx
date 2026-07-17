"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardCheck, FileText, LayoutDashboard, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionAuthUser } from "@/lib/validateSession";
import { DEFAULT_ROUTES } from "@/lib/routeAccess";

const navItems = [
  { label: "Data Aset", href: "/assets", icon: Boxes },
  { label: "Tambah Aset", href: "/assets/create", icon: Plus },
  { label: "Serah Terima", href: "/assets/handover", icon: ClipboardCheck },
  { label: "Pengembalian", href: "/assets/returns", icon: RotateCcw },
  { label: "Dokumen", href: "/assets/documents", icon: FileText },
];

export default function AssetShell({ user, children }: { user: SessionAuthUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActiveHref = (href: string) => {
    if (href === "/assets") {
      const isDetailPage = /^\/assets\/\d+/.test(pathname);
      return pathname === "/assets" || isDetailPage;
    }

    return pathname === href;
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Internal Workspace</div>
            <div className="mt-3 text-2xl font-black tracking-tight">Asset Control</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-300">Dashboard khusus pencatatan aset, pemegang, dan dokumen serah terima.</div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveHref(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                    active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link href={DEFAULT_ROUTES[user.role]} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard Utama
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sahabat Qolbu Internal</div>
              <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">Asset Management Dashboard</h1>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Login sebagai <span className="font-bold text-slate-950">{user.fullName}</span> ({user.role})
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => {
              const active = isActiveHref(item.href);
              return (
                <Link key={item.label} href={item.href} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold", active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600")}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="p-3 md:p-5">{children}</main>
      </div>
    </div>
  );
}