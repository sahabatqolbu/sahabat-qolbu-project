import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Package,
  UserCircle,
  Users,
  MessageCircle,
} from "lucide-react";
import { AuthStoreHydrator } from "@/components/auth/AuthStoreHydrator";
import { DEFAULT_ROUTES, getRoleRedirectPath } from "@/lib/routeAccess";
import { sessionToAuthUser, validateSession } from "@/lib/validateSession";

const desktopAgenNav = [
  { href: "/agen", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agen/jamaah", label: "Jamaah", icon: Users },
  { href: "/agen/website", label: "Website", icon: Globe },
  { href: "/agen/calendar", label: "Kalender", icon: Calendar },
  { href: "/agen/profile", label: "Profil", icon: UserCircle },
];

const desktopJamaahNav = [
  { href: "/jamaah", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jamaah/packages", label: "Paket", icon: Package },
  { href: "/jamaah/documents", label: "Dokumen", icon: FileText },
  { href: "/jamaah/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/jamaah/profile", label: "Profil", icon: UserCircle },
  { href: "/jamaah/calendar", label: "Kalender", icon: Calendar },
];

const desktopCalonJamaahNav = [
  { href: "/calon-jamaah", label: "Beranda", icon: LayoutDashboard },
  { href: "/calon-jamaah/packages", label: "Paket", icon: Package },
  { href: "/calon-jamaah/interests", label: "Diminati", icon: FileText },
  { href: "/calon-jamaah/consultation", label: "Konsultasi", icon: MessageCircle },
  { href: "/calon-jamaah/account", label: "Akun", icon: UserCircle },
];

interface MobileLayoutProps {
  children: React.ReactNode;
}

interface DesktopNavProps {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

function DesktopNav({ title, items }: DesktopNavProps) {
  return (
    <div className="hidden md:block border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{title}</p>
              <p className="text-sm font-semibold text-gray-900">Navigasi Desktop</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MobileLayout({ children }: MobileLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const session = await validateSession(token);

  if (!session) {
    redirect("/login");
  }

  const redirectPath = getRoleRedirectPath(session.role, `/${session.role.toLowerCase()}`);
  if (!["AGEN", "JAMAAH", "CALON_JAMAAH"].includes(session.role)) {
    redirect(redirectPath ?? DEFAULT_ROUTES[session.role]);
  }

  const user = sessionToAuthUser(session);

  return (
    <>
      <AuthStoreHydrator user={user} />
      <div className="min-h-screen bg-gray-50">
        {session.role === "AGEN" ? (
          <DesktopNav title="Area Agen" items={desktopAgenNav} />
        ) : session.role === "CALON_JAMAAH" ? (
          <DesktopNav title="Area Calon Jamaah" items={desktopCalonJamaahNav} />
        ) : (
          <DesktopNav title="Area Jamaah" items={desktopJamaahNav} />
        )}
        {children}
      </div>
    </>
  );
}
