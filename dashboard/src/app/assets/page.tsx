import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  Boxes,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogIn,
  RotateCcw,
} from "lucide-react";
import { AuthStoreHydrator } from "@/components/auth/AuthStoreHydrator";
import AssetWorkspace from "@/components/assets/AssetWorkspace";
import { DEFAULT_ROUTES } from "@/lib/routeAccess";
import { sessionToAuthUser, validateSession } from "@/lib/validateSession";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Data Aset", icon: Boxes },
  { label: "Serah Terima", icon: ClipboardCheck },
  { label: "Pengembalian", icon: RotateCcw },
  { label: "Dokumen", icon: FileText },
];

export default async function AssetDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const session = await validateSession(token);

  if (!session) redirect("/login?redirect=/assets");
  if (session.role !== "ADMIN" && session.role !== "STAFF") {
    redirect(DEFAULT_ROUTES[session.role]);
  }

  const user = sessionToAuthUser(session);

  return (
    <>
      <AuthStoreHydrator user={user} />
      <div className="min-h-screen bg-[#eef2f6] text-slate-950">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-slate-950 text-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Internal Workspace
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight">
                Asset Control
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Dashboard khusus pencatatan aset, pemegang, dan dokumen serah
                terima.
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                      item.label === "Data Aset"
                        ? "bg-white text-slate-950"
                        : "text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <a
                href={DEFAULT_ROUTES[session.role]}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Kembali ke Dashboard Utama
              </a>
            </div>
          </div>
        </aside>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Sahabat Qolbu Internal
                </div>
                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                  Asset Management Dashboard
                </h1>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Login sebagai{" "}
                <span className="font-bold text-slate-950">
                  {user.fullName}
                </span>{" "}
                ({user.role})
              </div>
            </div>
          </header>

          <main className="p-3 md:p-5">
            <AssetWorkspace />
          </main>
        </div>
      </div>
    </>
  );
}
